import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@mui/material'; // You can use any button library or HTML button
import CustomHeader from '../components/CustomHeader'; // Assuming it's compatible or adjusted for web
import { fonts } from '../theme';

import CustomButton from '../components/Button';

function LanguageInstructions() {
  const history = useNavigate();
  const location = useLocation();
  const { sessionId, isAll } = location.state || {};  // Accessing params from the location state in React Router
  console.log(location.state)
  const navigate = () => {
    history('/expressive-assessment', { state: { sessionId, isAll } },
    );
  };

  const navigateBack = () => {
    history(-1);
  };

  return (
    <div style={styles.safe_area}>
      <CustomHeader title="Expressive Language Disorder" goBack={navigateBack} />
      <div className='bg-white h-[80vh] text-center w-[80vw] flex-col justify-center p-20 items-center m-10 rounded-lg shadow-lg' >
      <div style={styles.scrollView}>
          <img
            style={styles.image}
            src={require('../assets/images/mouth.png')}
            alt="Mouth"
          />

          <p style={{ ...styles.base, ...styles.heading, textAlign: 'center' }}>
            Assessment Instructions
          </p>
          <div style={{ height: '20px' }} />

          <div className="h-[30vh]  w-[80vw] flex flex-col items-center justify-center">
  <div style={styles.text_row}>
 <span className="text-teal-500 text-[20px] animate-pulse glow">•</span>
     <p style={{ ...styles.base, fontSize: 16, fontWeight: 400, textAlign: 'justify', width: '100%' }}>
      You will be shown some images of random objects. Say the names of each object loud and clearly.
    </p>
  </div>

  <div style={styles.text_row}>
    <span  className="text-teal-500 text-[20px] animate-pulse glow">•</span>
    <p style={{ ...styles.base, fontSize: 16, fontWeight: 400, textAlign: 'justify', width: '100%' }}>
      Hit the  "Record"  button to start answering , making sure to speak clearly and loudly for acurate.
    </p>
  </div>

  <div style={styles.text_row}>
    <span  className="text-teal-500 text-[20px] animate-pulse glow">•</span>
    <p style={{ ...styles.base, fontSize: 16, fontWeight: 400, textAlign: 'justify', width: '100%' }}>
      IzzyAl will respond advising whether your answers are correct or incorrect, guiding you to improve.
    </p>
  </div>
</div>



        <CustomButton onPress={navigate} title="Start Now" />
        </div>

      </div>
</div>

  );
}

const styles = {
  safe_area: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    backgroundColor: '#F7F7F7',
    minHeight: '100vh',
  },
  main_view: {
    flex: 1,
    width: '100%',
    maxWidth: '800px',
  },
  scrollView: {
    overflowY: 'auto',
    maxHeight: 'calc(100vh - 120px)',
  },
  text_row: {
    gap: '10px',
    marginTop: '10px',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  base: {
    fontFamily: fonts.regular,
    color: '#111920',
  },
  heading: {
    paddingTop: '50px',
    fontSize: '24px',
    fontWeight: '500',
    textAlign: 'center',
  },
  image: {
    marginTop: '40px',
    display: 'block',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
};

export default LanguageInstructions;
