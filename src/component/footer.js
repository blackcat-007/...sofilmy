import React from 'react';
import {Popcorn as PopcornIcon} from "lucide-react";
const Footer = () => (
    <footer className="relative z-10 border-t border-white/10 bg-black/40">
        
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <PopcornIcon className="h-4 w-4" />
                    <span className="text-sm">© {new Date().getFullYear()} Shubho. All rights reserved under the Apache License 2.0.</span>
                    <span className="text-sm">SoFilmy. Built by cinephiles, for cinephiles.</span>
                  </div>
                  <div>
                  <div className="text-xs text-zinc-500">No spoilers unless you ask for them. Pinky promise.</div>
                  <div className="text-xs text-zinc-500">
            Contact info:   <a href="mailto:shubhodeepmukherjee24@gmail.com">shubhodeepmukherjee24@gmail.com</a>
        </div>
        </div>
                </div>
    </footer>
);

export default Footer;