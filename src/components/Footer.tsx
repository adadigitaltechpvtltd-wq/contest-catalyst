import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { Instagram, Twitter, Youtube, Linkedin } from "lucide-react";
import GaalLogo from "./GaalLogo";

const Footer = forwardRef<HTMLElement>((_, ref) => {
  const socialLinks = [
    { icon: Instagram, href: "https://www.instagram.com/gaal.app/" },
    { icon: Twitter, href: "https://x.com/gaalapp" },
    { icon: Youtube, href: "https://www.youtube.com/@gaalapp" },
    { icon: Linkedin, href: "https://www.linkedin.com/in/gaalapp/" },
  ];

  return (
    <footer ref={ref} className="border-t border-border py-12 bg-card/50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          {/* Logo & Description */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link to="/" className="flex items-center mb-4">
              <GaalLogo size="md" />
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              Skill-based photography contests where creativity meets rewards. Free to enter, win real prizes.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Platform</h4>
            <ul className="space-y-2">
              <li><Link to="/contests" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Browse Contests</Link></li>
              <li><Link to="/how-gaal-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How GAAL Works</Link></li>
              <li><Link to="/leaderboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Leaderboard</Link></li>
              <li><Link to="/contest-rules" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contest Rules</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link to="/copyright" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Copyright Policy</Link></li>
              <li><Link to="/age-policy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Age & Eligibility</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Support</h4>
            <ul className="space-y-2">
              <li><Link to="/report" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Report Abuse</Link></li>
              <li><a href="mailto:support@gaal.com" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact Us</a></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Connect</h4>
            <div className="flex items-center gap-3 mb-4">
              {socialLinks.map((social, i) => (
                <a 
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            © 2024 Gaal. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="/contest-rules" className="hover:text-foreground transition-colors">Rules</Link>
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";

export default Footer;