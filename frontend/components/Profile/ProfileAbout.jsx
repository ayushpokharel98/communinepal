import { useOutletContext } from "react-router-dom";
import About from "../About";

const ProfileAbout = () => {
  const { profile } = useOutletContext();

  return <About user={profile} />;
};

export default ProfileAbout;