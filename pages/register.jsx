import Link from 'next/link';
import { LayoutLogin } from 'components/Layout';
import { useRouter } from 'next/router';
import axiosClient from 'axiosSetup';
import RegisterForm from 'components/forms/RegisterForm';
import { useState } from 'react';
import Backdrop from 'components/backdrop/Backdrop';
import { Spinner } from 'react-bootstrap';
import { useAuth } from 'app/authContext';

const Register = () => {
  const router = useRouter();
  const [validated, setValidated] = useState(false);
  const { isAuthenticated, loading, register } = useAuth();
  if (isAuthenticated) {
    router.replace('/');
  }

  const handleRegister = async (data, errors, setErrors) => {
    const email = data.email;
    if (email) {
      register(data);
    }
  };

  return (
    <>
      <div className='row'>
        <div
          className='col-xl-5 d-none d-xl-block p-0 vh-100 bg-image-cover bg-no-repeat'
          style={{
            backgroundImage: `url("https://via.placeholder.com/800x950.png")`,
          }}
        ></div>
        <div className='col-xl-7 vh-100 align-items-center d-flex bg-white rounded-3 overflow-hidden'>
          <div className='card shadow-none border-0 ms-auto me-auto login-card'>
            <div className='card-body rounded-0 text-left'>
              <h2 className='fw-700 display1-size display2-md-size mb-4'>
                Create <br />
                your account
              </h2>
              <RegisterForm onSubmit={handleRegister} validated={validated} />

              <div className='col-sm-12 p-0 text-left'>
                <h6 className='text-grey-500 font-xsss fw-500 mt-0 mb-0 lh-32'>
                  Already have account{' '}
                  <Link href='/login'>
                    <a className='fw-700 ms-1'>Login</a>
                  </Link>
                </h6>
              </div>
            </div>
          </div>
        </div>
      </div>
      {loading && (
        <Backdrop className='justify-content-center align-items-center'>
          <Spinner className='text-current' animation='border' role='status'>
            <span className='visually-hidden'>Loading...</span>
          </Spinner>
        </Backdrop>
      )}
    </>
  );
};

Register.getLayout = function getLayout(page) {
  return <LayoutLogin>{page}</LayoutLogin>;
};

export default Register;
