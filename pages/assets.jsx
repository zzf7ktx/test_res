import Layout from 'components/Layout';
import PageTitle from 'components/PageTitle';
import LoadAssets from 'components/LoadAssets';
import FloatingButton from 'components/floatingbutton/FloatingButton';
import { FiPlus, FiShoppingBag } from 'react-icons/fi';

const Assets = () => {
  return (
    <div className='row w-100'>
      <div className='col-xl-12 pe-0 middle-wrap'>
        <FloatingButton icon={<FiPlus />} href={`/post/create`} />
        <FloatingButton icon={<FiShoppingBag />} href={`/market`} index={1} />
        <PageTitle title={'My Assets'} />
        <LoadAssets />
      </div>
    </div>
  );
};

Assets.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default Assets;
