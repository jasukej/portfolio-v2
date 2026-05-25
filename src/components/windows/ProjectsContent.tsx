"use client";

import { useState } from "react";
import {
  Folder,
  FolderOpen,
  ExternalLink,
  FileText,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { PROJECTS, type Project } from "@/data/projects";

export default function ProjectsContent() {
  const [selectedProject, setSelectedProject] = useState<Project>(PROJECTS[0]);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    [PROJECTS[0].name]: true,
  });

  const toggleFolder = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenFolders((prev) => ({ ...prev, [name]: !prev[name] }));
    const project = PROJECTS.find((p) => p.name === name);
    if (!openFolders[name] && project) {
      setSelectedProject(project);
    }
  };

  const selectProject = (project: Project) => {
    setSelectedProject(project);
    setOpenFolders((prev) => ({ ...prev, [project.name]: true }));
  };

  return (
    <div className="absolute inset-0 flex flex-row bg-canvas text-navy font-mono text-xs overflow-hidden">
      <div className="w-[180px] shrink-0 border-r border-navy bg-canvas overflow-y-auto scrollbar-thin scrollbar-thumb-navy/20">
        <div className="py-2 px-4 font-bold text-navy text-[10px] uppercase tracking-wider mb-1 border-b border-navy/20">
          Explorer
        </div>
        <div className="px-2 pt-2">
          <div className="flex items-center gap-1.5 py-1 text-navy font-semibold cursor-default">
            <ChevronDown size={14} className="shrink-0" />
            <span className="truncate">PROJECTS</span>
          </div>
          <div className="pl-4">
            {PROJECTS.map((project) => {
              const isOpen = openFolders[project.name];
              const isSelected = selectedProject.name === project.name;

              return (
                <div key={project.name} className="mt-0.5">
                  <div
                    className={`flex items-center gap-1.5 py-1 px-1 cursor-pointer transition-colors ${isSelected && !isOpen
                        ? "bg-navy text-canvas font-bold"
                        : "hover:bg-navy/10 text-navy"
                      }`}
                    onClick={(e) => toggleFolder(project.name, e)}
                  >
                    {isOpen ? (
                      <ChevronDown size={14} className="shrink-0" />
                    ) : (
                      <ChevronRight size={14} className="shrink-0" />
                    )}
                    {isOpen ? (
                      <FolderOpen size={14} className="shrink-0" />
                    ) : (
                      <Folder size={14} className="shrink-0" />
                    )}
                    <span className="truncate">{project.name}</span>
                  </div>

                  {isOpen && (
                    <div className="pl-5 space-y-0.5 py-0.5">
                      <div
                        className={`flex items-center gap-1.5 py-1 px-1 cursor-pointer transition-colors ${isSelected
                            ? "bg-navy text-canvas font-bold"
                            : "hover:bg-navy/10 text-navy"
                          }`}
                        onClick={() => selectProject(project)}
                      >
                        <FileText size={14} className="shrink-0" />
                        <span className="truncate">README.md</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-canvas">
        <div className="flex bg-canvas border-b border-navy overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2 px-3 py-2 bg-navy text-canvas font-bold min-w-fit cursor-default">
            <FileText size={14} />
            <span className="truncate">README.md</span>
            <span className="ml-2 text-[10px] opacity-70 shrink-0">
              ~/{selectedProject.name}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-navy/20">
          <div className="max-w-2xl">
            <div className="mb-6 border-y border-dashed border-navy/30 py-3 text-navy/70">
              <div>
                <span className="font-bold text-navy">title:</span> &quot;
                {selectedProject.name}&quot;
              </div>
              <div>
                <span className="font-bold text-navy">year:</span>{" "}
                {selectedProject.year}
              </div>
            </div>

            <h1 className="text-xl font-bold uppercase tracking-wider mb-4 border-b border-navy/20 pb-2 text-navy">
              # {selectedProject.name}
            </h1>

            <p className="text-navy leading-relaxed mb-6 text-sm">
              {selectedProject.description}
            </p>

            {selectedProject.tags.length > 0 && (
              <div className="mb-6 mt-10">
                <div className="font-bold mb-2 uppercase text-[10px] tracking-widest text-navy/60">
                  ## Tech Stack
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-transparent border border-navy text-navy rounded-none text-[11px]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedProject.url && (
              <div className="mt-8 mb-4">
                <a
                  href={selectedProject.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-canvas border-2 border-navy hover:bg-navy hover:text-canvas transition-colors text-navy font-bold rounded-none text-xs shadow-[3px_3px_0px_var(--color-navy)] hover:shadow-none hover:translate-x-[3px] transform hover:translate-y-[3px]"
                >
                  <ExternalLink size={14} />
                  <span>View Repository</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
