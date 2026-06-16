import Link from "next/link";

const Newsletter = () => {
  return (
    <section>
      <div className="container mx-auto lg:max-w-screen-xl md:max-w-screen-md px-4">
        <div className="rounded-2xl bg-secondary p-10 md:p-16 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to start building IELTS readiness?
          </h2>
          <p className="text-white/80 text-base md:text-lg max-w-2xl mx-auto mb-8">
            Create a profile, study foundation resources, practise each module,
            and track progress toward your target band.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-block bg-white text-secondary font-semibold px-10 py-4 rounded-full hover:opacity-90 transition-opacity"
            >
              Create free account
            </Link>
            <Link
              href="/#courses"
              className="inline-block bg-transparent text-white border-2 border-white font-semibold px-10 py-4 rounded-full hover:bg-white hover:text-secondary transition-all"
            >
              View mock tests
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
