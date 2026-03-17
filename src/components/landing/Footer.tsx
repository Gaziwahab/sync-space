import { Github, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border py-12 px-4">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">S</span>
          </div>
          <span className="font-semibold text-lg">SyncSpace</span>
        </div>

        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-colors">About</a>
          <a href="#" className="hover:text-foreground transition-colors">Docs</a>
          <a href="#" className="hover:text-foreground transition-colors">Blog</a>
          <a href="#" className="hover:text-foreground transition-colors">Pricing</a>
        </div>

        <div className="flex items-center gap-4">
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
            <Github className="w-5 h-5" />
          </a>
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
            <Twitter className="w-5 h-5" />
          </a>
        </div>
      </div>
      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-border text-center text-xs text-muted-foreground">
        © 2026 SyncSpace. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
