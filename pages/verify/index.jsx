import { Fragment } from "react";
import Header from "../../components/header/Header";
import LeftNav from "../../components/leftnav/LeftNav";
import RightNav from "../../components/rightnav/RightNav";
import VerifyImage from "../../components/verify/VerifyImage";
import Link from "next/link";
const EditProfile = () => {
  return (
    <Fragment>
      <Header />
      <LeftNav />

      <div className='main-content bg-lightblue theme-dark-bg right-chat-active'>
        <div className='middle-sidebar-bottom'>
          <div className='middle-sidebar-left'>
            <div className='middle-wrap'>
              <VerifyImage />
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default EditProfile;