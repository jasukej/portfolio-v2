"use client";

import { useState, useRef, useEffect } from "react";
import { useWindowStore, type WindowId } from "@/store/useWindowStore";

export default function MenuBar() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const openWindow = useWindowStore((s) => s.openWindow);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMenu = (menu: string) => {
    if (activeMenu === menu) {
      setActiveMenu(null);
    } else {
      setActiveMenu(menu);
    }
  };

  const handleAppClick = (id: WindowId) => {
    openWindow(id);
    setActiveMenu(null);
  };

  return (
    <div 
      ref={menuRef}
      className="absolute top-0 left-0 right-0 h-[24px] bg-canvas border-b border-navy flex items-center px-1 z-[9999] select-none text-[13px] font-sans font-bold text-navy"
    >
      <div className="relative h-full">
        <div 
          className={`px-3 h-full flex items-center justify-center cursor-pointer ${activeMenu === "apple" ? "bg-navy text-canvas" : "hover:bg-navy/10"}`}
          onClick={() => toggleMenu("apple")}
        >
          <svg width="14" height="14" viewBox="0 0 170 170" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.92.21-9.84-1.96-14.75-6.53-3.13-2.73-7.1-7.43-11.87-14.1C24.17 135 18.25 122.95 16.5 109.12c-2.24-17.52 2.05-31.96 12.87-43.32 4.6-4.8 10.05-8.32 16.36-10.55 6.3-2.23 12.75-3.23 19.34-2.98 5.86.32 11.45 1.83 16.73 4.54 5.28 2.7 8.92 4.06 10.92 4.06 1.8 0 5.86-1.57 12.22-4.7 6.35-3.13 12.35-4.5 17.98-4.13 8.35.43 15.42 2.92 21.2 7.48-5.3 4.88-8 10.95-8.08 18.2-.1 8.86 3.14 15.86 9.73 21.03 3.03 2.37 6.4 4.08 10.12 5.15-2.25 6.74-5.04 12.08-8.36 16.03M116.82 24.3c-3.1 3.52-7.3 5.48-12.63 5.9-1.08-7.77 2.1-15 9.53-21.68 3.07-2.8 6.9-4.82 11.5-6.05 1.15 7.6-2.12 14.8-8.4 21.83z" />
          </svg>
        </div>
        
        {activeMenu === "apple" && (
          <div className="absolute top-full left-0 bg-canvas border-x border-b border-navy min-w-[150px] shadow-[2px_2px_0px_rgba(0,0,0,0.1)] py-1">
            <div 
              className="px-4 py-1.5 hover:bg-navy hover:text-canvas cursor-pointer"
              onClick={() => handleAppClick("about")}
            >
              About
            </div>
            <div className="h-[1px] bg-navy my-1 border-none"></div>
            <div 
              className="px-4 py-1 hover:bg-navy hover:text-canvas cursor-pointer"
              onClick={() => handleAppClick("experiences")}
            >
              Experiences
            </div>
            <div 
              className="px-4 py-1 hover:bg-navy hover:text-canvas cursor-pointer"
              onClick={() => handleAppClick("projects")}
            >
              Projects
            </div>
            <div 
              className="px-4 py-1 hover:bg-navy hover:text-canvas cursor-pointer"
              onClick={() => handleAppClick("blog")}
            >
              Blog
            </div>
            <div 
              className="px-4 py-1 hover:bg-navy hover:text-canvas cursor-pointer"
              onClick={() => handleAppClick("contact")}
            >
              Contact
            </div>
            <div 
              className="px-4 py-1 hover:bg-navy hover:text-canvas cursor-pointer"
              onClick={() => handleAppClick("terminal")}
            >
              Terminal
            </div>
            <div 
              className="px-4 py-1 hover:bg-navy hover:text-canvas cursor-pointer"
              onClick={() => handleAppClick("settings")}
            >
              Settings
            </div>
          </div>
        )}
      </div>

      <div className="relative h-full group">
        <div 
          className={`px-3 h-full flex items-center cursor-pointer ${activeMenu === "file" ? "bg-navy text-canvas" : "hover:bg-navy/10"}`}
          onClick={() => toggleMenu("file")}
        >
          File
        </div>
        {activeMenu === "file" && (
          <div className="absolute top-full left-0 bg-canvas border-x border-b border-navy min-w-[150px] shadow-[2px_2px_0px_rgba(0,0,0,0.1)] py-1">
            <div className="px-4 py-1 text-navy/40 cursor-default">New Folder</div>
            <div className="px-4 py-1 text-navy/40 cursor-default">Open</div>
            <div className="px-4 py-1 text-navy/40 cursor-default">Close Window</div>
            <div className="h-[1px] bg-navy/20 my-1 border-b border-dotted border-navy/40"></div>
            <div className="px-4 py-1 text-navy/40 cursor-default">Get Info</div>
            <div className="px-4 py-1 text-navy/40 cursor-default">Duplicate</div>
            <div className="px-4 py-1 text-navy/40 cursor-default">Make Alias</div>
            <div className="px-4 py-1 text-navy/40 cursor-default">Put Away</div>
            <div className="h-[1px] bg-navy/20 my-1 border-b border-dotted border-navy/40"></div>
            <div className="px-4 py-1 text-navy/40 cursor-default">Find...</div>
          </div>
        )}
      </div>

      <div className="relative h-full group">
        <div 
          className={`px-3 h-full flex items-center cursor-pointer ${activeMenu === "edit" ? "bg-navy text-canvas" : "hover:bg-navy/10"}`}
          onClick={() => toggleMenu("edit")}
        >
          Edit
        </div>
        {activeMenu === "edit" && (
          <div className="absolute top-full left-0 bg-canvas border-x border-b border-navy min-w-[150px] shadow-[2px_2px_0px_rgba(0,0,0,0.1)] py-1">
            <div className="px-4 py-1 text-navy/40 cursor-default">Undo</div>
            <div className="h-[1px] bg-navy/20 my-1 border-b border-dotted border-navy/40"></div>
            <div className="px-4 py-1 text-navy/40 cursor-default">Cut</div>
            <div className="px-4 py-1 text-navy/40 cursor-default">Copy</div>
            <div className="px-4 py-1 text-navy/40 cursor-default">Paste</div>
            <div className="px-4 py-1 text-navy/40 cursor-default">Clear</div>
          </div>
        )}
      </div>

      <div className="relative h-full group">
        <div 
          className={`px-3 h-full flex items-center cursor-pointer ${activeMenu === "view" ? "bg-navy text-canvas" : "hover:bg-navy/10"}`}
          onClick={() => toggleMenu("view")}
        >
          View
        </div>
        {activeMenu === "view" && (
          <div className="absolute top-full left-0 bg-canvas border-x border-b border-navy min-w-[150px] shadow-[2px_2px_0px_rgba(0,0,0,0.1)] py-1">
            <div className="px-4 py-1 text-navy/40 cursor-default">by Small Icon</div>
            <div className="px-4 py-1 text-navy/40 cursor-default whitespace-nowrap">by Icon</div>
            <div className="px-4 py-1 text-navy/40 cursor-default">by Name</div>
            <div className="px-4 py-1 text-navy/40 cursor-default">by Size</div>
            <div className="px-4 py-1 text-navy/40 cursor-default">by Kind</div>
            <div className="px-4 py-1 text-navy/40 cursor-default">by Date</div>
          </div>
        )}
      </div>

      <div className="relative h-full group">
        <div 
          className={`px-3 h-full flex items-center cursor-pointer ${activeMenu === "special" ? "bg-navy text-canvas" : "hover:bg-navy/10"}`}
          onClick={() => toggleMenu("special")}
        >
          Special
        </div>
        {activeMenu === "special" && (
          <div className="absolute top-full left-0 bg-canvas border-x border-b border-navy min-w-[150px] shadow-[2px_2px_0px_rgba(0,0,0,0.1)] py-1">
            <div className="px-4 py-1 text-navy/40 cursor-default">Clean Up Window</div>
            <div className="px-4 py-1 text-navy/40 cursor-default mb-1">Empty Trash</div>
            <div className="h-[1px] bg-navy/20 my-1 border-b border-dotted border-navy/40"></div>
            <div className="px-4 py-1 text-navy/40 cursor-default">Erase Disk</div>
            <div className="h-[1px] bg-navy/20 my-1 border-b border-dotted border-navy/40"></div>
            <div className="px-4 py-1 text-navy/40 cursor-default">Restart</div>
            <div className="px-4 py-1 text-navy/40 cursor-default">Shut Down</div>
          </div>
        )}
      </div>
      
    </div>
  );
}