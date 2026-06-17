import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-deep-slate py-10">
      <div className="container mx-auto lg:max-w-screen-xl md:max-w-screen-md px-4">
        <div className="grid grid-cols-1 gap-y-10 gap-x-16 sm:grid-cols-2 lg:grid-cols-12">
          {/* Column 1 - Logo & Description */}
          <div className="col-span-4 md:col-span-12 lg:col-span-4">
            <Link href="/" className="mb-4 inline-flex">
              <span className="inline-flex items-center font-bold gap-2 text-lg text-secondary">
                <span className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary text-white shadow-sm">
                  <span className="text-[0.72em] font-black leading-none">D</span>
                  <span className="absolute right-[18%] top-[16%] h-1.5 w-1.5 rounded-full bg-success" />
                </span>
                <span>DOshomik IELTS</span>
              </span>
            </Link>
            <p className="text-grey text-sm mb-4 max-w-xs">
              Basic English foundations, original IELTS practice, mock tests, transparent AI feedback, and score prediction.
            </p>
            <div className="flex items-center gap-4">
              <Link href="#" className="hover:text-primary text-grey text-3xl transition-colors" aria-label="Facebook">
                <Icon icon="tabler:brand-facebook" />
              </Link>
              <Link href="#" className="hover:text-primary text-grey text-3xl transition-colors" aria-label="Twitter">
                <Icon icon="tabler:brand-twitter" />
              </Link>
              <Link href="#" className="hover:text-primary text-grey text-3xl transition-colors" aria-label="Instagram">
                <Icon icon="tabler:brand-instagram" />
              </Link>
            </div>
          </div>

          {/* Column 2 - Links */}
          <div className="col-span-2">
            <h3 className="mb-4 text-2xl font-medium text-midnight-text">Links</h3>
            <ul>
              {["Features", "Courses", "Mentor", "Testimonial"].map((item) => (
                <li key={item} className="mb-2 text-grey hover:text-primary w-fit transition-colors">
                  <Link href={`#${item.toLowerCase()}`}>{item}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 - Other */}
          <div className="col-span-2">
            <h3 className="mb-4 text-2xl font-medium text-midnight-text">Other</h3>
            <ul>
              {["About Us", "Our Team", "Career", "Services", "Contact"].map((item) => (
                <li key={item} className="mb-2 text-grey hover:text-primary w-fit transition-colors">
                  <Link href="#">{item}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 - Contact */}
          <div className="col-span-4 space-y-3 md:col-span-4 lg:col-span-4">
            <div className="flex gap-2">
              <Icon icon="tabler:brand-google-maps" className="text-primary text-3xl" />
              <h5 className="text-lg text-grey">925 Filbert Street Pennsylvania 18072</h5>
            </div>
            <div className="flex gap-2">
              <Icon icon="tabler:phone" className="text-primary text-3xl" />
              <h5 className="text-lg text-grey">+45 3411-4411</h5>
            </div>
            <div className="flex gap-2">
              <Icon icon="tabler:folder" className="text-primary text-3xl" />
              <h5 className="text-lg text-grey">info@doshomikielts.com</h5>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 lg:flex items-center justify-between border-t border-slate-300 pt-8">
          <h4 className="text-grey text-sm text-center lg:text-start font-normal">
            &copy; {currentYear} DOshomik IELTS. Practice estimates only.
          </h4>
          <div className="flex gap-5 mt-5 lg:mt-0 justify-center lg:justify-start">
            <Link href="/" className="text-grey text-sm font-normal hover:text-primary transition-colors">
              Privacy policy
            </Link>
            <Link href="/" className="text-grey text-sm font-normal hover:text-primary transition-colors">
              Terms & conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
