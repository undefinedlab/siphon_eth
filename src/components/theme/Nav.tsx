"use client";

import { useState } from "react";
import Link from "next/link";
import SwapInterface from "../swap_face/SwapInterface";

export default function Nav() {
  const [showSwapModal, setShowSwapModal] = useState(false);

  return (
    <>
      <nav>
        <div className="logo">
          <Link href="/" className="logo-link">
            <div className="logo-container">
              <svg width="24" height="20" viewBox="0 0 97.34 80" className="logo-svg">
                <path d="M70.66,35.93a11.66,11.66,0,0,1,1,.83c1.84,1.89,3.69,3.78,5.5,5.7,2.24,2.35,2.14,1.66-.06,3.9-4.47,4.53-9,9-13.49,13.49-1,1-1,1.09-.16,1.95q7.47,7.5,15,15c.85.85,1,.85,1.83,0q7.5-7.47,15-15c.84-.85.83-1,0-1.84-1.58-1.61-3.2-3.2-4.8-4.8l-9.72-9.73c-1.05-1-1-1.07,0-2.14.07-.08.15-.15.23-.23L92.22,32c1.5-1.47,3-2.94,4.49-4.43.86-.87.84-.9,0-1.81-.14-.16-.3-.3-.46-.46L81.59,10.63Q76.67,5.71,71.75.8c-1.07-1.07-1.09-1.07-2.17,0L64.82,5.66,37.45,33.19q-5.19,5.22-10.38,10.43c-.88.88-.9.87-1.77,0S23.83,42,23.08,41.26c-1.46-1.5-2.95-3-4.41-4.5-1.05-1.1-1-1.11,0-2.16l.23-.23Q25.94,27.28,33,20.19c1.08-1.08,1.09-1.08,0-2.16q-4.27-4.31-8.56-8.59c-2.06-2.06-4.11-4.13-6.18-6.17-.94-.93-1-.91-1.95,0-.2.18-.39.37-.58.56q-6.52,6.53-13,13c-.46.46-.92.91-1.36,1.38-.74.81-.73.88,0,1.73.18.2.37.38.56.57l8.81,8.81c1.83,1.83,3.64,3.67,5.49,5.49.54.52.62.95,0,1.46-.33.28-.62.61-.92.91L.85,51.75a3.65,3.65,0,0,0-.76.82,1.43,1.43,0,0,0,0,1c.1.28.42.48.64.71q12,12.45,24.05,24.89c1.1,1.14,1.11,1.14,2.28,0l29.48-29.3,13.2-13.1C70,36.47,70.3,36.24,70.66,35.93Z" fill="currentColor"/>
              </svg>
              <p>Siphon Protocol</p>
            </div>
          </Link>
        </div>

        <div className="nav-items">

        
  <p>
  <a href="https://github.com/undefinedlab/siphon_eth" target="_blank" rel="noopener noreferrer">
    docs
  </a>
</p>
<p>
  <a href="https://github.com/undefinedlab/siphon_eth" target="_blank" rel="noopener noreferrer">
    about
  </a>
</p>
          <button onClick={() => setShowSwapModal(true)} className="nav-link">swap</button>
        </div>
      </nav>

      {showSwapModal && (
        <div className="modal-overlay" onClick={() => setShowSwapModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <SwapInterface />
          </div>
        </div>
      )}
    </>
  );
}


