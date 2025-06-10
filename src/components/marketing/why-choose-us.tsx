"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  ShieldCheck,
  DollarSign,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Testimonial {
  text: string;
  author: string;
  date: string;
}

const testimonials: Testimonial[] = [
  {
    text: "another discord yearly went smooth",
    author: "zuzey",
    date: "8.02.2025",
  },
  {
    text: "discord for the missus :eine_very_smug1:",
    author: "blancas8851",
    date: "16.01.2025",
  },
  {
    text: "another discord year let's goooo",
    author: "Turtle Turtle",
    date: "19.12.2024",
  },
  {
    text: "4th year👌",
    author: "Unknown",
    date: "25.10.2024",
  },
  {
    text: "x2 nitro for another year amazing",
    author: "Turtle Turtle",
    date: "25.11.2023",
  },
  {
    text: "already bought more than 3 years",
    author: "Deleted User",
    date: "23.11.2023",
  },
  {
    text: "2 years and still going :steamhappy:",
    author: "four",
    date: "30.10.2023",
  },
  {
    text: "3 years and till going👌",
    author: "Unknown",
    date: "23.10.2023",
  },
  {
    text: "Let's get another year of nitro. Easy.",
    author: "Turtle Turtle",
    date: "13.07.2023",
  },
];

// Group testimonials into slides of 3
const testimonialSlides: Testimonial[][] = [];
for (let i = 0; i < testimonials.length; i += 3) {
  testimonialSlides.push(testimonials.slice(i, i + 3));
}

const benefits = [
  {
    icon: DollarSign,
    title: "Save Up to 80%",
    description:
      "Get premium subscriptions at a fraction of the retail cost through legal regional pricing differences.",
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
  },
  {
    icon: ShieldCheck,
    title: "100% Legal & Safe",
    description:
      "All our subscriptions are obtained through legitimate means and comply with platform terms of service.",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
  {
    icon: Clock,
    title: "Instant Delivery",
    description:
      "Most subscriptions are delivered within minutes of purchase. Fast, reliable, and automated.",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
  },
  {
    icon: Users,
    title: "Trusted Community",
    description:
      "Join thousands of satisfied customers who save money on their favorite subscriptions every month.",
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
  },
];

export function WhyChooseUs() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % testimonialSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % testimonialSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) =>
        (prev - 1 + testimonialSlides.length) % testimonialSlides.length,
    );
  };

  return (
    <section id="why-choose-us" className="py-20 relative overflow-x-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 to-gray-900"></div>

      {/* Animated shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          className="absolute top-[20%] left-[10%] w-64 h-64 bg-purple-500/5 rounded-full blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: "reverse",
            delay: 1,
          }}
          className="absolute bottom-[20%] right-[10%] w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Why Choose{" "}
            <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              EaseSubs?
            </span>
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            We make premium subscriptions accessible to everyone through legal
            regional pricing and exceptional service.
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
              className={`${benefit.bgColor} ${benefit.borderColor} backdrop-blur-lg p-6 rounded-2xl border transition-all duration-300 hover:shadow-lg`}
            >
              <div
                className={`inline-flex items-center justify-center w-12 h-12 ${benefit.bgColor} rounded-lg mb-4`}
              >
                <benefit.icon className={`w-6 h-6 ${benefit.color}`} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {benefit.title}
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Testimonials Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <div className="text-center mb-16">
            <h3 className="text-4xl md:text-5xl font-bold text-white mb-6">
              What Our{" "}
              <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                Customers Say
              </span>
            </h3>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Real feedback from our satisfied community members
            </p>
          </div>

          {/* Testimonials Carousel */}
          <div className="relative">
            <div className="rounded-2xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-8 py-4"
                >
                  {testimonialSlides[currentSlide]?.map(
                    (testimonial, index) => (
                      <div key={index} className="group relative">
                        <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-lg p-8 rounded-2xl border border-gray-700/50 shadow-2xl transition-all duration-300 hover:shadow-lg hover:border-purple-500/30 hover:-translate-y-1">
                          {/* Quote Icon */}
                          <div className="absolute top-6 right-6 opacity-20">
                            <svg
                              className="w-8 h-8 text-purple-400"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z" />
                            </svg>
                          </div>

                          <div className="relative z-10">
                            <p className="text-gray-200 mb-6 italic text-lg leading-relaxed font-medium">
                              &ldquo;{testimonial.text}&rdquo;
                            </p>

                            <div className="flex justify-between items-center">
                              <div className="flex items-center">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
                                  <span className="text-white font-bold text-lg">
                                    {testimonial.author[0]?.toUpperCase() ||
                                      "U"}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-purple-400 font-semibold text-lg">
                                    {testimonial.author}
                                  </span>
                                  <div className="text-gray-500 text-sm">
                                    {testimonial.date}
                                  </div>
                                </div>
                              </div>

                              {/* Star Rating */}
                              <div className="flex items-center space-x-1">
                                {[...Array(5)].map((_, i) => (
                                  <svg
                                    key={i}
                                    className="w-5 h-5 text-yellow-400 fill-current"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                  </svg>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Hover Effect Gradient */}
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                        </div>
                      </div>
                    ),
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="flex justify-center items-center mt-12 space-x-6">
              <button
                onClick={prevSlide}
                className="p-4 text-gray-400 hover:text-white bg-gray-800/50 hover:bg-purple-600/20 rounded-full border border-gray-600 hover:border-purple-500/50 transition-all duration-300 shadow-lg hover:scale-110"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <div className="flex space-x-3">
                {testimonialSlides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-4 h-4 rounded-full transition-all duration-300 hover:scale-125 ${
                      index === currentSlide
                        ? "bg-purple-500 shadow-lg shadow-purple-500/50"
                        : "bg-gray-600 hover:bg-gray-500"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={nextSlide}
                className="p-4 text-gray-400 hover:text-white bg-gray-800/50 hover:bg-purple-600/20 rounded-full border border-gray-600 hover:border-purple-500/50 transition-all duration-300 shadow-lg hover:scale-110"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

