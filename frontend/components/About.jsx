const About = ({ user }) => {
  const genderMap = {
    m: "Male",
    f: "Female",
    n: "Prefer not to say",
  };

  const details = [
    {
      label: "Email",
      value: user?.user?.email,
      type: "email",
    },
    {
      label: "Bio",
      value: user?.bio || "No bio added yet",
    },
    {
      label: "Website",
      value: user?.website,
      type: "link",
    },
    {
      label: "Phone Number",
      value: user?.phone_number || "No phone number added yet",
    },
    {
      label: "Gender",
      value: genderMap[user?.gender] || "Not specified",
    },
    {
      label: "Date of Birth",
      value: user?.date_of_birth || "No DOB added yet",
    },
    {
      label: "Address",
      value: user?.address || "No address added yet",
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto mb-14">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-700">
          <h2 className="text-xl md:text-2xl font-semibold text-white">
            About
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Personal profile information
          </p>
        </div>

        <div className="p-4 space-y-3">
          {details.map((item) => (
            <div
              key={item.label}
              className="group flex flex-col md:flex-row md:items-start gap-2 md:gap-6 rounded-xl px-4 py-4 bg-gray-900/40 hover:bg-gray-700/40 transition-all duration-200 border border-transparent hover:border-gray-600"
            >
              <div className="md:w-40 shrink-0">
                <p className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                  {item.label}
                </p>
              </div>

              <div className="flex-1 text-gray-100 wrap-break-word">
                {item.type === "email" && item.value ? (
                  <a
                    href={`mailto:${item.value}`}
                    className="hover:text-blue-400 transition-colors"
                  >
                    {item.value}
                  </a>
                ) : item.type === "link" && item.value ? (
                  <a
                    href={item.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-400 transition-colors break-all"
                  >
                    {item.value}
                  </a>
                ) : (
                  <span
                    className={
                      item.value
                        ? "text-gray-100"
                        : "text-gray-500 italic"
                    }
                  >
                    {item.value || "Not available"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default About;