"use client";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import { getImagePrefix } from "@/utils/util";

const courseData: {
  heading: string;
  name: string;
  imgSrc: string;
  price: number;
  rating: number;
  students: number;
  classes: number;
}[] = [
  {
    heading: "IELTS Listening — Audio Drills",
    name: "Original audio, transcripts, objective answers, accepted variants, and instant estimated scoring.",
    imgSrc: "images/courses/course-1.png",
    price: 0,
    rating: 4.4,
    students: 150,
    classes: 12,
  },
  {
    heading: "IELTS Reading — Passage Practice",
    name: "IELTS-style passages, question sets, answer explanations, and source-span rationale.",
    imgSrc: "images/courses/course-2.png",
    price: 0,
    rating: 4.5,
    students: 130,
    classes: 12,
  },
  {
    heading: "IELTS Writing — Task Feedback",
    name: "Task 1 and Task 2 responses evaluated against IELTS-style criteria with practical revision advice.",
    imgSrc: "images/courses/course-3.png",
    price: 0,
    rating: 5,
    students: 120,
    classes: 12,
  },
  {
    heading: "IELTS Speaking — Part 1, 2 & 3",
    name: "Part 1, Part 2, and Part 3 practice with text or audio response paths and feedback after evaluation.",
    imgSrc: "images/courses/course-1.png",
    price: 0,
    rating: 5,
    students: 150,
    classes: 12,
  },
  {
    heading: "Full Mock Tests — Timed Practice",
    name: "Complete all four modules in a timed mock test to unlock an unofficial score prediction.",
    imgSrc: "images/courses/course-2.png",
    price: 0,
    rating: 5,
    students: 150,
    classes: 12,
  },
  {
    heading: "Vocabulary & Grammar Foundation",
    name: "Build your English foundation with targeted vocabulary, synonym, and grammar drills.",
    imgSrc: "images/courses/course-3.png",
    price: 0,
    rating: 4.2,
    students: 150,
    classes: 12,
  },
];

const Courses = () => {
  const settings = {
    dots: false,
    infinite: true,
    slidesToShow: 3,
    slidesToScroll: 2,
    arrows: false,
    autoplay: true,
    speed: 500,
    cssEase: "linear",
    responsive: [
      {
        breakpoint: 1200,
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
    const fullStars = Math.floor(rating);
    const halfStars = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStars;

    return (
      <>
        {Array.from({ length: fullStars }).map((_, i) => (
          <Icon
            key={`full-${i}`}
            icon="tabler:star-filled"
            className="text-yellow-500 text-xl inline-block"
          />
        ))}
        {halfStars > 0 && (
          <Icon
            icon="tabler:star-half-filled"
            className="text-yellow-500 text-xl inline-block"
          />
        )}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Icon
            key={`empty-${i}`}
            icon="tabler:star-filled"
            className="text-gray-300 text-xl inline-block"
          />
        ))}
      </>
    );
  };

  return (
    <section id="courses" className="bg-white">
      <div className="mx-auto lg:max-w-screen-xl md:max-w-screen-md px-4">
        <div className="sm:flex justify-between items-center mb-12">
          <h2 className="text-midnight-text text-4xl lg:text-5xl font-semibold mb-5 sm:mb-0">
            Popular modules.
          </h2>
          <Link
            href="/practice"
            className="text-primary text-lg font-medium hover:tracking-widest duration-500"
          >
            Explore practice&nbsp;&gt;&nbsp;
          </Link>
        </div>

        <Slider {...settings}>
          {courseData.map((items, i) => (
            <div key={i}>
              <div className="bg-white m-3 mb-12 px-3 pt-3 pb-12 shadow-course-shadow rounded-2xl h-full">
                <div className="relative rounded-3xl">
                  <Image
                    src={`${getImagePrefix()}${items.imgSrc}`}
                    alt="course-image"
                    width={389}
                    height={262}
                    className="m-auto"
                  />
                  <div className="absolute right-5 -bottom-2 bg-secondary rounded-full p-6">
                    <h3 className="text-white uppercase text-center text-sm font-medium">
                      {items.price === 0 ? "free" : `$${items.price}`}
                    </h3>
                  </div>
                </div>

                <div className="px-3 pt-6">
                  <h3 className="text-2xl font-bold text-midnight-text max-w-75% inline-block">
                    {items.heading}
                  </h3>
                  <p className="text-base font-normal pt-4 text-grey">{items.name}</p>

                  <div className="flex justify-between items-center py-6 border-b border-slate-200">
                    <div className="flex items-center gap-4">
                      <h3 className="text-primary text-2xl font-medium">
                        {items.rating}
                      </h3>
                      <div className="flex">{renderStars(items.rating)}</div>
                    </div>
                    <h3 className="text-3xl font-medium text-secondary">
                      {items.price === 0 ? "Free" : `$${items.price}`}
                    </h3>
                  </div>

                  <div className="flex justify-between pt-6">
                    <div className="flex gap-4">
                      <Icon
                        icon="solar:notebook-minimalistic-outline"
                        className="text-primary text-xl inline-block"
                      />
                      <h3 className="text-base font-medium text-black/75">
                        {items.classes} exercises
                      </h3>
                    </div>
                    <div className="flex gap-4">
                      <Icon
                        icon="solar:users-group-rounded-linear"
                        className="text-primary text-xl inline-block"
                      />
                      <h3 className="text-base font-medium text-black/75">
                        {items.students} learners
                      </h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </section>
  );
};

export default Courses;
