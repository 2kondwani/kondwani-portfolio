// src/components/Experience.js
import PropTypes from "prop-types";

export default function Experience({
  image,
  alt,
  org,
  title,
  location,
  date,
  link,
  showDivider = true,
}) {
  return (
    <>
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="grid grid-cols-[60px_1fr_auto] gap-x-6 w-full py-4 hover:bg-[#f3f2ef] transition rounded-lg"
      >
        <img
          src={image}
          alt={alt}
          className="w-14 h-14 rounded-full object-cover border border-gray-200 shadow-sm"
        />

        <div className="flex flex-col justify-center min-w-0">
          <span className="text-lg font-semibold truncate">{org}</span>
          <span className="text-sm text-gray-500 mt-1 truncate">{title}</span>
        </div>

        <div className="flex flex-col justify-center items-end min-w-[9rem]">
          <span className="text-lg font-semibold text-right">{location}</span>
          <span className="text-sm text-gray-500 mt-1 text-right">{date}</span>
        </div>
      </a>

      {showDivider && <hr className="border-t border-gray-300 w-full" />}
    </>
  );
}

Experience.propTypes = {
  image: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  org: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  location: PropTypes.string.isRequired,
  date: PropTypes.string.isRequired,
  link: PropTypes.string.isRequired,
  showDivider: PropTypes.bool,
};
