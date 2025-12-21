"use client";
import React from 'react';

/**
 * ResourcesPage Component
 * Renders the main content for the "Resources" section of the application.
 */
export default function ResourcesPage() {
  return (
    <div className="p-6">
      <h2 className="text-3xl font-extrabold text-green-700 mb-4">
        Resource Library
      </h2>
      <p className="text-lg text-gray-600 mb-6">
        A collection of external links, documentation, and guides 
        relevant to persona development and data security best practices.
      </p>

      <div className="bg-white p-4 rounded-lg shadow-md border border-green-100">
        <h3 className="text-xl font-semibold mb-2 text-green-500">
          Quick Links
        </h3>
        <ul className="space-y-2 text-gray-700">
          <li className="p-2 border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
            Data Privacy Regulations Guide
          </li>
          <li className="p-2 border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
            Persona Research Templates (PDF)
          </li>
          <li className="p-2 hover:bg-gray-50 cursor-pointer">
            Ethical AI Guidelines 2.0
          </li>
        </ul>
        <p className="mt-4 text-sm text-gray-500">
          (This will eventually contain searchable documentation.)
        </p>
      </div>
    </div>
  );
}