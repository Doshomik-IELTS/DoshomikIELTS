"use client";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import React from "react";
import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import { getImagePrefix } from "@/utils/util";

const TestimonialData = [
  { name: "রফিকুল ইসলাম", profession: "IELTS শিক্ষার্থী", comment: "প্ল্যাটফর্মটি আমাকে রাইটিংয়ে আমার দুর্বল দিকগুলো বুঝতে সাহায্য করেছে। AI ফিডব্যাক বিস্তারিত এবং কার্যকর ছিল। আমি মাত্র দুই মাসে ব্যান্ড ৬ থেকে ৭ এ উন্নতি করেছি।", imgSrc: "images/testimonial/testimonial-1.png", rating: 5 },
  { name: "তাহমিনা আক্তার", profession: "IELTS শিক্ষার্থী", comment: "মক টেস্টগুলো অসাধারণ ছিল। সময়ধারণ পরিবেশ আসল পরীক্ষার জন্য আমাকে পুরোপুরি প্রস্তুত করেছে। স্কোর প্রেডিকশন নির্ভুল ছিল — ঠিক যতটুকু প্রেডিক্ট করেছিল ততটুকুই পেয়েছি।", imgSrc: "images/testimonial/testimonial-2.png", rating: 5 },
  { name: "শরিফুল হাসান", profession: "IELTS শিক্ষার্থী", comment: "ভোকাবুলারি এবং গ্রামার ড্রিলগুলো আমার ভিত্তি গঠনের জন্য চমৎকার ছিল। রিসোর্সগুলো অরিজিনাল এবং সুগঠিত। স্ব-অধ্যয়নের জন্য দারুণ একটি প্ল্যাটফর্ম।", imgSrc: "images/testimonial/testimonial-3.png", rating: 5 },
  { name: "নাসরিন জাহান", profession: "IELTS শিক্ষার্থী", comment: "অডিও সাবমিশন এবং মূল্যায়নসহ স্পিকিং প্র্যাকটিস আমার ঠিক যা প্রয়োজন ছিল। উচ্চারণ এবং ফ্লুয়েন্সির উপর ফিডব্যাক আমার আত্মবিশ্বাস বাড়াতে সাহায্য করেছে।", imgSrc: "images/testimonial/testimonial-4.png", rating: 5 },
  { name: "মোঃ ইব্রাহিম", profession: "IELTS শিক্ষার্থী", comment: "প্রোগ্রেস ট্র্যাকিং আমাকে অনুপ্রাণিত রেখেছে। আমি সপ্তাহে সপ্তাহে আমার উন্নতি দেখতে পাচ্ছিলাম। ড্যাশবোর্ড পরবর্তীতে কী ফোকাস করতে হবে তা জানাতে সহজ করে দিয়েছে।", imgSrc: "images/testimonial/testimonial-5.png", rating: 5 },
  { name: "ফারহানা ইয়াসমিন", profession: "IELTS শিক্ষার্থী", comment: "কপিরাইট-নিরাপদ পদ্ধতিটি আমার জন্য গুরুত্বপূর্ণ ছিল। জেনে রাখা যে সব কন্টেন্ট অরিজিনাল, তা প্ল্যাটফর্মের উপর আমার আস্থা বাড়িয়েছে। পড়ার প্যাসেজগুলো আকর্ষণীয় এবং সুন্দরভাবে লেখা।", imgSrc: "images/testimonial/testimonial-6.png", rating: 5 },
];

const Testimonial = () => {
  const settings = {
    dots: true,
    dotsClass: "slick-dots",
    infinite: true,
    slidesToShow: 3,
    slidesToScroll: 2,
    arrows: false,
    autoplay: true,
    responsive: [
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 800,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Icon
            key={i}
            icon="tabler:star-filled"
            className={`text-xl inline-block ${i < rating ? "text-yellow-500" : "text-gray-300"}`}
          />
        ))}
      </div>
    );
  };

  return (
    <section id="testimonial">
      <div className="container mx-auto lg:max-w-screen-xl md:max-w-screen-md px-4">
        <h2 className="text-midnight_text text-4xl lg:text-5xl font-semibold text-center mb-4">What learners say.</h2>
        <p className="text-grey text-lg text-center mb-12 max-w-2xl mx-auto">
          Hear from learners who have used DOshomik IELTS to prepare for their exam.
        </p>

        <Slider {...settings}>
          {TestimonialData.map((items, i) => (
            <div key={i}>
              <div
                className={`bg-white rounded-2xl m-4 p-6 my-20 relative ${
                  i % 2 === 0 ? "shadow-testimonial-shadow1" : "shadow-testimonial-shadow2"
                }`}
              >
                <div className="absolute top-[-45px]">
                  <Image
                    src={`${getImagePrefix()}${items.imgSrc}`}
                    alt={items.name}
                    width={100}
                    height={100}
                    className="rounded-full"
                  />
                </div>
                <h4 className="text-base font-normal text-grey my-4 leading-relaxed pt-8">{items.comment}</h4>
                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <div>
                    <h3 className="text-lg font-semibold text-midnight_text">{items.name}</h3>
                    <p className="text-sm font-normal text-grey">{items.profession}</p>
                  </div>
                  <div className="flex">{renderStars(items.rating)}</div>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </section>
  );
};

export default Testimonial;
