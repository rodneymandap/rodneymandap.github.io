// import Head from "next/head";
// import GitHubIcon from "@material-ui/icons/GitHub";
// import LinkedInIcon from "@material-ui/icons/LinkedIn";
// import { IconButton } from "@material-ui/core";
import Image from "next/image";
import myPic from "../public/myPic.jpg";
import myLogo from "../public/logo-white.png";

export default function Home() {
  return (
    <div>
      <nav className="bg-transparent absolute left-0 top-0 w-full z-50 md:py-[20px]">
        <div className="mx-16">
          <div className="flex items-center justify-between">
            <Image
              className="fill-blue-500"
              src={myLogo}
              alt="Rodney"
              width="100"
              height="100"
            />
            <ul className="">
              {/* <li className="relative inline-block">
                <a className="relative group text-[16px] text-white px-10">
                  Skills
                </a>
              </li>
              <li className="relative inline-block">
                <a className="relative group text-[16px] text-white py-32">
                  Certifications
                </a>
              </li> */}
            </ul>
            {/* <a className="text-white">Resume</a> */}
          </div>
        </div>
      </nav>

      <section className="bg-[#131313] h-[900px] relative z-40 overflow-hidden">
        <div className="w-full h-full bg-cover bg-center text-left z-50">
          <div className="mx-16">
            <div className="flex-1">
              <div className="w-[660px] mt-[210px]">
                <h2 className="text-[90px] text-white capitalize font-bold leading-[100px] mb-[10px]">
                  <span className="block text-[#47c3eb] text-[60px]">
                    Hello,
                  </span>
                  I am Rodney.
                </h2>
                <h5 className="text-[#59C378] text-[25px] capitalize font-semibold leading-[39px] mb-[20px]">
                  Software Engineer | DevOps Practicioner
                </h5>

                <p className="text-white text-[19px] capitalize font-normal">
                  With 7 years of experience in the field, I have developed a
                  deep understanding of Software Development & DevOps and am
                  committed to delivering high-quality work that meets the needs
                  of my clients.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-[20%] rounded-[50%] right-[150px] z-10">
          <Image
            className="rounded-[50%]"
            src={myPic}
            width="500"
            height="500"
            alt=""
          />
        </div>
      </section>
    </div>
  );
}
