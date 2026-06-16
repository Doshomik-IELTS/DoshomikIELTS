import Link from "next/link";
import { Icon } from "@iconify/react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-deep-slate py-10">
      <div className="container mx-auto lg:max-w-screen-xl md:max-w-screen-md px-4">
        <div className="grid grid-cols-1 gap-y-10 gap-x-16 sm:grid-cols-2 lg:grid-cols-12 xl:gap-x-8">
          {/* Column 1 - Logo & Description */}
          <div className="col-span-4">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <div className="bg-secondary rounded-xl w-10 h-10 flex items-center justify-center">
                <span className="text-white text-xl font-bold">D</span>
              </div>
              <span className="text-secondary font-bold text-xl">
                DOshomik IELTS
              </span>
            </Link>
            <p className="text-grey text-sm mb-6 max-w-xs">
              Build IELTS readiness with original practice material, mock tests,
              and progress tracking — all designed for Bangladeshi learners.
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="#"
                className="text-grey hover:text-primary text-2xl transition-colors"
                aria-label="Facebook"
              >
                <Icon icon="tabler:brand-facebook" />
              </Link>
              <Link
                href="#"
                className="text-grey hover:text-primary text-2xl transition-colors"
                aria-label="Twitter"
              >
                <Icon icon="tabler:brand-twitter" />
              </Link>
              <Link
                href="#"
                className="text-grey hover:text-primary text-2xl transition-colors"
                aria-label="Instagram"
              >
                <Icon icon="tabler:brand-instagram" />
              </Link>
            </div>
          </div>

          {/* Column 2 - Links */}
          <div className="col-span-2">
            <h3 className="mb-4 text-2xl font-medium text-midnight-text">
              Links
            </h3>
            <ul className="space-y-2">
              {["Features", "Courses", "Mentor", "Testimonial"].map(
                (item) => (
                  <li key={item}>
                    <a
                      href={`#${item.toLowerCase()}`}
                      className="text-grey hover:text-primary transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Column 3 - Other */}
          <div className="col-span-2">
            <h3 className="mb-4 text-2xl font-medium text-midnight-text">
              Other
            </h3>
            <ul className="space-y-2">
              {[
                "About Us",
                "Our Team",
                "Career",
                "Services",
                "Contact",
              ].map((item) => (
                <li key={item}>
                  <Link
                    href="#"
                    className="text-grey hover:text-primary transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 - Contact */}
          <div className="col-span-4">
            <h3 className="mb-4 text-2xl font-medium text-midnight-text">
              Contact
            </h3>
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <Icon
                  icon="tabler:brand-google-maps"
                  className="text-primary text-2xl mt-0.5 shrink-0"
                />
                <span className="text-grey">
                  925 Filbert Street Pennsylvania 18072
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Icon
                  icon="tabler:phone"
                  className="text-primary text-2xl shrink-0"
                />
                <span className="text-grey">+45 3411-4411</span>
              </div>
              <div className="flex items-center gap-3">
                <Icon
                  icon="tabler:folder"
                  className="text-primary text-2xl shrink-0"
                />
                <span className="text-grey">info@doshomikielts.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-grey/20 flex flex-col lg:flex-row items-center justify-between gap-4">
          <p className="text-grey text-sm text-center lg:text-start">
            &copy; {currentYear} DOshomik IELTS. Practice estimates only.
          </p>
          <div className="flex gap-5">
            <Link
              href="#"
              className="text-grey text-sm hover:text-primary transition-colors"
            >
              Privacy policy
            </Link>
            <Link
              href="#"
              className="text-grey text-sm hover:text-primary transition-colors"
            >
              Terms &amp; conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
