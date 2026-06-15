import { useOutletContext } from "react-router-dom";
import Shares from "../Shares";

const ProfileShares = () => {
  const { profile } = useOutletContext();

  return <Shares userId={profile.user.id} />;
};

export default ProfileShares;