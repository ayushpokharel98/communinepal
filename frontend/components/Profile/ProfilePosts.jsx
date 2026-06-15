import { useOutletContext } from "react-router-dom";
import Posts from "../Posts"

const ProfilePosts = () => {
  const { profile, username } = useOutletContext();

  return (
    <Posts
      userId={profile.user.id}
      username={username}
      type="profile"
    />
  );
};

export default ProfilePosts;