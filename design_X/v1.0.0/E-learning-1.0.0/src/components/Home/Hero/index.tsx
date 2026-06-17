import Image from 'next/image';
import Link from 'next/link';
import { Icon } from "@/components/ui/Icon";
import { getImagePrefix } from '@/utils/util';

const Hero = () => {
  return (
    <section id="home-section" className='bg-slate-gray pt-28'>
        <div className="container mx-auto lg:max-w-screen-xl md:max-w-screen-md px-4">
        <div className='grid grid-cols-1 lg:grid-cols-12 items-center gap-8'>
          <div className='col-span-6 flex flex-col gap-8'>
            <div className='flex gap-2 mx-auto lg:mx-0'>
              <Icon
                icon="solar:verified-check-bold"
                className="text-success text-xl inline-block"
              />
              <p className='text-success text-sm font-semibold text-center lg:text-start'>Basic English to IELTS readiness</p>
            </div>
            <h1 className='text-midnight-text text-4xl sm:text-5xl font-semibold'>Advance your IELTS skills with DOshomik.</h1>
            <h3 className='text-black/70 text-lg'>Build skills with owned resources, practise each IELTS module, complete original mock tests, and see transparent unofficial band estimates.</h3>
            <div className="relative rounded-full">
              <input
                type="text"
                name="q"
                className="py-6 lg:py-7 pl-8 pr-20 text-lg w-full text-black rounded-full focus:outline-none shadow-input-shadow"
                placeholder="Search grammar, vocabulary, writing, reading..."
                autoComplete="off"
              />
              <Link
                href="/resources"
                className="bg-secondary p-5 rounded-full absolute right-2 top-2"
              >
                <Icon
                  icon="solar:magnifer-linear"
                  className="text-white text-4xl"
                />
              </Link>
            </div>
            <div className='flex items-center justify-between pt-6 lg:pt-2'>
              <div className='flex gap-2'>
                <Image src={`${getImagePrefix()}images/banner/check-circle.svg`} alt="check" width={30} height={30} />
                <p className='text-sm sm:text-lg font-normal text-black'>Original resources</p>
              </div>
              <div className='flex gap-2'>
                <Image src={`${getImagePrefix()}images/banner/check-circle.svg`} alt="check" width={30} height={30} />
                <p className='text-sm sm:text-lg font-normal text-black'>Learning path</p>
              </div>
              <div className='flex gap-2'>
                <Image src={`${getImagePrefix()}images/banner/check-circle.svg`} alt="check" width={30} height={30} />
                <p className='text-sm sm:text-lg font-normal text-black'>Band prediction</p>
              </div>
            </div>
          </div>
          <div className='col-span-6 flex justify-center'>
            <Image
              src={`${getImagePrefix()}images/banner/doshomik-ielts-hero.png`}
              alt="Doshomik IELTS learner studying with online preparation tools"
              width={1000}
              height={805}
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
