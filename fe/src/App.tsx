import { Routes, Route } from "react-router-dom";
import HeaderPage from "./component/HeaderPage";
import FooterPage from "./component/FooterPage";
import FileUpload from "./pages/FileUpload";
import ClipsPage from "./pages/ClipsPage";
import SocialMediaPage from "./pages/SocialMediaPage";
import InstagramUploadPage from "./pages/InstagramUploadPage";
import YouTubeUploadPage from "./pages/YouTubeUploadPage";

const App = () => {
  return (
    <>
      <HeaderPage />
      <Routes>
        <Route path="/" element={<FileUpload />} />
        <Route path="/clips" element={<ClipsPage />} />
        <Route path="/social" element={<SocialMediaPage />} />
        <Route path="/instagram" element={<InstagramUploadPage />} />
        <Route path="/youtube" element={<YouTubeUploadPage />} />
      </Routes>
      <FooterPage />
    </>
  );
};

export default App;
