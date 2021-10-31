import styles from '../../styles/Explore.module.scss';
import Header from '../../components/header/Header';
import LeftNav from '../../components/leftnav/LeftNav';
import Postcard from '../../components/postcard/Postcard';
import PageTitle from '../../components/pagetitle/PageTitle';

const content = [
    {
        imageUrl: 'user.png',
        name: 'Aliqa Macale',
        email: 'support@gmail.com',
        bgImage: 'product.png',
    },
    {
        imageUrl: 'user.png',
        name: 'Hendrix Stamp',
        email: 'support@gmail.com',
        bgImage: 'product.png',
    },
    {
        imageUrl: 'user.png',
        name: 'Stephen Grider',
        email: 'support@gmail.com',
        bgImage: 'product.png',
    },
    {
        imageUrl: 'user.png',
        name: 'Mohannad Zitoun',
        email: 'support@gmail.com',
        bgImage: 'product.png',
    },
    {
        imageUrl: 'user.png',
        name: 'Aliqa Macale',
        email: 'support@gmail.com',
        bgImage: 'product.png',
    },
    {
        imageUrl: 'user.png',
        name: 'Surfiya Zakir',
        email: 'support@gmail.com',
        bgImage: 'product.png',
    },
    {
        imageUrl: 'user.png',
        name: 'Aliqa Macale',
        email: 'support@gmail.com',
        bgImage: 'product.png',
    },
    {
        imageUrl: 'user.png',
        name: 'Surfiya Zakir',
        email: 'support@gmail.com',
        bgImage: 'product.png',
    },
    {
        imageUrl: 'user.png',
        name: 'Aliqa Macale',
        email: 'support@gmail.com',
        bgImage: 'product.png',
    },
    {
        imageUrl: 'user.png',
        name: 'Surfiya Zakir',
        email: 'support@gmail.com',
        bgImage: 'product.png',
    },
    {
        imageUrl: 'user.png',
        name: 'Aliqa Macale',
        email: 'support@gmail.com',
        bgImage: 'product.png',
    },
    {
        imageUrl: 'user.png',
        name: 'Surfiya Zakir',
        email: 'support@gmail.com',
        bgImage: 'product.png',
    },

]

const Explore = () => {
    return (
        <div>
            <Header />
            <LeftNav />
            <div className="main-content">
                <div className="middle-sidebar-bottom">
                    <div className="middle-sidebar-left pe-0">
                        <div className="row">
                            <div className="col-xl-12">
                                <PageTitle title="For you" />
                                <div className="row ps-2 pe-1 justify-content-center">
                                    {content.map((value, index) =>
                                        <Postcard key={index} index={index} value={value} />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div >
    )
};

export default Explore;