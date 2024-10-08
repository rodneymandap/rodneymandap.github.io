import Image from "next/image";
import myPic from "../public/myPic.jpg";
import myLogo from "../public/logo-white.png";

function calculateYearsOfExperience() {
  const startYear = 2016;
  const currentYear = new Date().getFullYear();
  return currentYear - startYear;
}

export default function Home() {
  const yearsOfExperience = calculateYearsOfExperience();

  return (
    <div>
      <nav className="absolute left-0 top-0 z-50 w-full bg-transparent md:py-[20px]">
        <div className="mx-auto md:max-w-screen-xl">
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

      <section className="relative z-40 h-auto min-h-screen overflow-hidden bg-[#131313]">
        <div className="z-50 h-full w-full bg-cover bg-center text-left">
          <div className="mx-auto px-1 md:max-w-screen-xl">
            <div className="flex-1">
              <div className="mt-[150px] text-center md:mt-[100px] md:w-full md:text-left lg:mt-[210px] lg:w-[660px]">
                <h2 className="mb-[10px] text-[35px] font-bold capitalize leading-[35px] text-white md:text-[80px] md:leading-[100px]">
                  <span className="block text-[30px] text-[#47c3eb] md:text-[60px]">
                    Hello,
                  </span>
                  I am Rodney.
                </h2>
                <h5 className="mb-[10px] text-[20px] font-semibold capitalize leading-[39px] text-[#59C378] md:mb-[20px] md:text-[25px]">
                  Software Engineer | DevOps Practicioner
                </h5>

                <p className="text-[15px] font-normal capitalize leading-normal text-white md:text-[19px]">
                  With {yearsOfExperience} years of experience in the field, I
                  have developed a deep understanding of Software Development &
                  DevOps and am committed to delivering high-quality work that
                  meets the needs of my clients.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-[50%] z-10 h-[300px] w-[300px] translate-x-14 rounded-[50%] md:right-[200px] md:max-h-[500px] md:max-w-[500px] lg:top-[20%] lg:h-[500px] lg:w-[500px]">
          <Image className="rounded-[50%]" src={myPic} alt="Rodney's Picture" />
        </div>
      </section>
    </div>
  );
}
