"use client"
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Image from "next/image";
import { getImagePrefix } from "@/utils/util";

const MentorData = [
  { name: "রাহাত ইসলাম", profession: "রাইটিং টাস্ক ১ ও ২ মূল্যায়ন", imgSrc: "images/mentor/mentor-1.png" },
  { name: "তাহমিনা আক্তার", profession: "স্পিকিং কোচ — ফ্লুয়েন্সি ও উচ্চারণ", imgSrc: "images/mentor/mentor-2.png" },
  { name: "শরিফুল হাসান", profession: "কন্টেন্ট রিভিউয়ার — রিসোর্স ও উত্তর ব্যাখ্যা", imgSrc: "images/mentor/mentor-3.png" },
  { name: "নাজমুল হোসেন", profession: "টেস্ট ডিজাইনার — স্কোরিং ভ্যালিডেশন", imgSrc: "images/mentor/mentor-4.png" },
  { name: "রাইসা পারভীন", profession: "প্ল্যাটফর্ম ও লার্নিং এক্সপেরিয়েন্স", imgSrc: "images/mentor/mentor-5.png" },
  { name: "জাকির হোসেন", profession: "ইউজার রিসার্চ ও ফিডব্যাক", imgSrc: "images/mentor/mentor-6.png" },
];

const Mentor = () => {
  const settings = {
    dots: false,
    infinite: true,
    slidesToShow: 3,
    slidesToScroll: 1,
    arrows: false,
    autoplay: true,
    cssEase: "linear",
    responsive: [
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 3,
        },
      },
      {
        breakpoint: 1000,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 530,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };

  return (
    <section className="bg-deep-slate" id="mentor">
      <div className="container mx-auto lg:max-w-screen-xl md:max-w-screen-md px-4">
        <h2 className="text-midnight_text text-4xl lg:text-5xl font-semibold mb-8">
          Meet our team.
        </h2>

        <Slider {...settings}>
          {MentorData.map((items, i) => (
            <div key={i}>
              <div className="m-3 py-14 md:my-10 text-center">
                <div className="relative inline-block">
                  <Image
                    src={`${getImagePrefix()}${items.imgSrc}`}
                    alt="user-image"
                    width={306}
                    height={0}
                    className="inline-block"
                  />
                  <div className="absolute right-[84px] bottom-[102px] bg-white rounded-full p-4">
                    <Image
                      src={`${getImagePrefix()}images/mentor/linkedin.svg`}
                      alt="linkedin-image"
                      width={25}
                      height={24}
                    />
                  </div>
                </div>
                <div className="-mt-10">
                  <h3 className="text-2xl font-semibold text-midnight_text">{items.name}</h3>
                  <h4 className="text-lg font-normal text-midnight_text pt-2 opacity-50">{items.profession}</h4>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </section>
  );
};

export default Mentor;
