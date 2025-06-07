import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateCryptomusWebhook } from '@/lib/webhook-validation'
import { paymentRateLimit } from '@/lib/rate-limit'
import { emailService } from '@/lib/email'
import { CryptomusWebhook } from '@/lib/cryptomus'

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = paymentRateLimit.check(request)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many webhook requests' },
        { status: 429 }
      )
    }

    const body = await request.text()
    
    // SECURITY FIX: Extract signature from headers (Cryptomus sends it as 'sign' header)
    const signature = request.headers.get('sign') || ''
    
    // Validate webhook signature using the API key
    const apiKey = process.env.CRYPTOMUS_PAYMENT_API_KEY
    if (!apiKey) {
      console.error('CRYPTOMUS_PAYMENT_API_KEY not configured')
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      )
    }

    // SECURITY FIX: Use proper signature validation
    const validation = validateCryptomusWebhook(body, signature, apiKey)
    if (!validation.isValid) {
      console.error('Invalid Cryptomus webhook signature:', validation.error)
      console.error('Expected signature from header:', signature)
      console.error('Received body:', body)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Parse webhook data
    const webhookData: CryptomusWebhook = JSON.parse(body)
    const { order_id, status, uuid } = webhookData

    console.log('✅ Valid Cryptomus webhook received:', { 
      order_id, 
      status, 
      uuid,
      timestamp: new Date().toISOString()
    })

    if (!order_id || !status || !uuid) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Find payment record
    const payment = await db.payment.findFirst({
      where: {
        OR: [
          { id: uuid },
          { providerPaymentId: uuid },
          { order: { orderNumber: order_id } }
        ]
      },
      include: { 
        order: {
          include: {
            user: true,
            items: {
              include: {
                plan: {
                  include: {
                    product: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!payment) {
      console.error('Payment not found for Cryptomus webhook:', { order_id, uuid })
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Log current payment status for debugging
    console.log('Current payment status:', {
      paymentId: payment.id,
      currentStatus: payment.status,
      orderStatus: payment.order.status,
      newWebhookStatus: status
    })

    // Map Cryptomus status to our status
    let paymentStatus: 'COMPLETED' | 'FAILED' | 'CANCELLED' = 'FAILED'
    let orderStatus: 'COMPLETED' | 'FAILED' | 'CANCELLED' = 'FAILED'

    switch (status.toLowerCase()) {
      case 'paid':
      case 'paid_over':
      case 'confirm_check':
        paymentStatus = 'COMPLETED'
        orderStatus = 'COMPLETED'
        break
      case 'fail':
      case 'system_fail':
      case 'wrong_amount':
        paymentStatus = 'FAILED'
        orderStatus = 'FAILED'
        break
      case 'cancel':
      case 'refund_paid':
        paymentStatus = 'CANCELLED'
        orderStatus = 'CANCELLED'
        break
      case 'refund_process':
      case 'refund_fail':
        // Keep current status for refund processing states
        console.log('Refund processing webhook received, keeping current status')
        return NextResponse.json({ success: true })
      default:
        // For unknown statuses, don't update
        console.warn('Unknown Cryptomus payment status:', status)
        return NextResponse.json({ success: true })
    }

    // Update payment and order
    const updatedPayment = await db.$transaction(async (tx) => {
      const updatedPaymentRecord = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: paymentStatus,
          providerPaymentId: uuid,
          webhookData: JSON.parse(JSON.stringify(webhookData)),
          completedAt: paymentStatus === 'COMPLETED' ? new Date() : undefined,
          failureReason: paymentStatus === 'FAILED' ? `Payment failed: ${status}` : undefined,
        }
      })

      const updatedOrderRecord = await tx.order.update({
        where: { id: payment.orderId },
        data: {
          status: orderStatus,
          completedAt: orderStatus === 'COMPLETED' ? new Date() : undefined,
        }
      })

      // Create subscriptions if payment completed
      if (paymentStatus === 'COMPLETED') {
        const orderWithItems = await tx.order.findUnique({
          where: { id: payment.orderId },
          include: {
            items: {
              include: { plan: true }
            }
          }
        })

        if (orderWithItems) {
          for (const item of orderWithItems.items) {
            await tx.userSubscription.create({
              data: {
                userId: orderWithItems.userId,
                planId: item.planId,
                orderId: payment.orderId,
                status: 'ACTIVE',
                startDate: new Date(),
                endDate: new Date(Date.now() + (item.plan.duration * 24 * 60 * 60 * 1000)),
                renewalDate: new Date(Date.now() + (item.plan.duration * 24 * 60 * 60 * 1000)),
                price: item.price,
                currency: item.currency,
                billingPeriod: item.plan.billingPeriod,
                autoRenew: true,
              }
            })
          }
          console.log(`Created ${orderWithItems.items.length} subscriptions for completed order`)
        }
      }

      return { payment: updatedPaymentRecord, order: updatedOrderRecord }
    })

    // Log the successful status update
    console.log('✅ Payment status updated:', {
      paymentId: updatedPayment.payment.id,
      oldStatus: payment.status,
      newStatus: paymentStatus,
      orderStatus: orderStatus,
      timestamp: new Date().toISOString()
    })

    // Send email notification for completed orders
    if (paymentStatus === 'COMPLETED' && payment.order.user.email) {
      try {
        const orderItems = payment.order.items.map(item => ({
          productName: item.plan.product.name,
          planName: item.plan.name,
          price: Number(item.price)
        }))

        await emailService.sendOrderConfirmation(
          payment.order.user.email,
          payment.order.orderNumber,
          Number(payment.order.total),
          orderItems
        )
        console.log('✅ Order confirmation email sent')
      } catch (emailError) {
        console.error('Failed to send order confirmation email:', emailError)
        // Don't fail the webhook for email errors
      }
    }

    console.log(`✅ Cryptomus webhook processed successfully: ${order_id} - ${status}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('💥 Cryptomus webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 