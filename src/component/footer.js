import React from 'react';
import { Film, Mail, Scale } from "lucide-react"; // Scale for license, Mail for email
const Footer = () => (
      <footer className="relative z-10 border-t bg-gradient-to-tr from-black from-50% to-green-900/20 border-white/10 bg-black/60 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-8">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 text-center md:text-left">
          
          {/* Left Section: Branding */}
          <div className="flex items-center justify-center md:justify-start gap-3 text-zinc-300">
            <Film className="h-6 w-6 text-green-500 shrink-0" />
            <div className="flex flex-col">
              <span className="text-sm font-semibold">
                <span className="bg-gradient-to-b font-opensans  from-red-500 to-red-900 bg-clip-text text-transparent font-extrabold">...SO<span className=' bg-gradient-to-bl text-transparent from-green-600 to-85% to-white bg-clip-text font-cursive'>Filmy</span>
              </span></span>
              <span className="text-xs text-zinc-500">
                Built by cinephiles, for cinephiles
              </span>
            </div>
          </div>

          {/* Middle Section: License */}
          <div className="flex items-center justify-center gap-2 text-zinc-400">
            <Scale className="h-4 w-4 text-green-600 shrink-0" />
            <span className="text-sm">
              © {new Date().getFullYear()} Shubho • Licensed under Apache License 2.0
            </span>
          </div>

          {/* Right Section: Contact */}
          <div className="flex flex-col items-center md:items-end gap-2 text-sm text-zinc-400">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-green-700 shrink-0" />
              <a
                href="mailto:shubhodeepmukherjee24@gmail.com"
                className="hover:text-white transition-colors break-all"
              >
                shubhodeepmukherjee24@gmail.com
              </a>
            </div>
            <span className="text-xs text-zinc-500 italic">
              No spoilers unless you ask for them. Pinky promise.
            </span>
          </div>
        </div>
      </div>
    </footer>
);

export default Footer;