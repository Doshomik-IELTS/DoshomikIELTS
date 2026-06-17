import Link from "next/link";
import { Icon } from "@iconify/react";
import { Logo } from "@/components/layout/logo";

const headerData = [
  { label: "Features", href: "#features" },
  { label: "Courses", href: "#courses" },
  { label: "Mentor", href: "#mentor" },
  { label: "Testimonial", href: "#testimonial" },
];

export function FooterSection() {
  return (
    <footer className="bg-deep-slate py-10">
      <div className="container mx-auto lg:max-w-screen-xl md:max-w-screen-md px-4">
        <div className="grid grid-cols-1 gap-y-10 gap-x-16 sm:grid-cols-2 lg:grid-cols-12">
          <div className="col-span-4 md:col-span-12 lg:col-span-4">
            <Link href="/" className="mb-4 inline-flex">
              <Logo variant="full" size="md" />
            </Link>
            <p className="text-grey text-sm mb-4 max-w-xs">
              Basic English foundations, original IELTS practice, mock tests, transparent AI feedback, and score prediction.
            </p>
            <div className="flex items-center gap-4">
              <Link href="#" className="hover:text-primary text-grey text-3xl transition-colors">
                <Icon icon="tabler:brand-facebook" />
              </Link>
              <Link href="#" className="hover:text-primary text-grey text-3xl transition-colors">
                <Icon icon="tabler:brand-twitter" />
              </Link>
              <Link href="#" className="hover:text-primary text-grey text-3xl transition-colors">
                <Icon icon="tabler:brand-instagram" />
              </Link>
            </div>
          </div>
          <div className="col-span-2">
            <h3 className="mb-4 text-2xl font-medium text-midnight-text">Links</h3>
            <ul>
              {headerData.map((item) => (
                <li key={item.href} className="mb-2 text-grey hover:text-primary w-fit transition-colors">
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="col-span-2">
            <h3 className="mb-4 text-2xl font-medium text-midnight-text">Other</h3>
            <ul>
              <li className="mb-2 text-grey hover:text-primary w-fit transition-colors">
                <Link href="#">About Us</Link>
              </li>
              <li className="mb-2 text-grey hover:text-primary w-fit transition-colors">
                <Link href="#">Our Team</Link>
              </li>
              <li className="mb-2 text-grey hover:text-primary w-fit transition-colors">
                <Link href="#">Career</Link>
              </li>
              <li className="mb-2 text-grey hover:text-primary w-fit transition-colors">
                <Link href="#">Services</Link>
              </li>
              <li className="mb-2 text-grey hover:text-primary w-fit transition-colors">
                <Link href="#">Contact</Link>
              </li>
            </ul>
          </div>
          <div className="col-span-4 space-y-3 md:col-span-4 lg:col-span-4">
            <div className="flex items-center gap-2">
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

        <div className="mt-10 lg:flex items-center justify-between border-t border-slate-300 pt-8">
          <h4 className="text-grey text-sm text-center lg:text-start font-normal">
            &copy; {new Date().getFullYear()} DOshomik IELTS. Practice estimates only.
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
}
