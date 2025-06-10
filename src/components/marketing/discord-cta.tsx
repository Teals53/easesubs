"use client";

import React from "react";
import { MessageSquare } from "lucide-react";

export function DiscordCTA() {
  return (
    <section id="discord" className="py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-purple-900/30"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto bg-gray-800/90 backdrop-blur-sm rounded-2xl p-8 md:p-12 shadow-xl border border-purple-500/20">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-full md:w-3/5">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Join Our{" "}
                <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                  Discord
                </span>{" "}
                Community
              </h2>

              <p className="text-gray-300 mb-6 leading-relaxed">
                Our Discord server is the hub for all transactions and support.
                Join today to browse all available subscriptions, make
                purchases, and get instant assistance.
              </p>

              <ul className="space-y-3 mb-8">
                {[
                  "Browse all available subscriptions",
                  "Receive instant support from our team",
                  "Join a community of smart shoppers",
                  "Stay updated with new deals and offers",
                ].map((item, index) => (
                  <li key={index} className="flex items-start">
                    <span className="bg-purple-500/20 rounded-full p-1 mr-3 mt-0.5">
                      <svg
                        className="w-4 h-4 text-purple-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </span>
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>

              <a
                href="https://discord.gg/QWbHNAq9Dw"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl px-8 py-4 text-lg shadow-lg shadow-purple-600/30 transition-all duration-300 hover:shadow-purple-600/50 hover:scale-105"
              >
                <MessageSquare className="mr-2" size={20} />
                Join Discord
              </a>
            </div>

            <div className="w-full md:w-2/5 flex justify-center">
              <div className="w-64 h-64 relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-full opacity-20" />
                <div className="absolute inset-2 bg-gray-800 rounded-full flex items-center justify-center">
                  <div className="w-20 h-20 flex items-center justify-center">
                    <svg
                      className="text-purple-500"
                      width="80"
                      height="80"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M13 3L4 13H11L10 21L19 11H12L13 3Z"
                        fill="#9333EA"
                        stroke="#9333EA"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

