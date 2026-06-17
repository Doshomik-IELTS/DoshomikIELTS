import Link from "next/link";

const Newsletter = () => {
  return (
    <section>
      <div className="container mx-auto lg:max-w-screen-xl md:max-w-screen-md px-4">
        <div className="rounded-2xl bg-secondary p-10 md:p-16 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">
            Ready to start building IELTS readiness?
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Create a profile, study foundation resources, practise each module,
            and track progress toward your target band.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-white text-secondary hover:bg-white/90 px-8 py-6 text-base rounded-full font-semibold"
            >
              Create free account
            </Link>
            <Link
              href="/mock-tests"
              className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-base rounded-full font-semibold"
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
