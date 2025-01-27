import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import Webcam from 'react-webcam';
import { useDataContext } from '../contexts/DataContext';
import CustomHeader from '../components/CustomHeader';
import WaveSVG from '../assets/Wave';
import { detectExpression, getToken } from "../utils/functions";
import { useNavigate, useLocation } from 'react-router-dom';
import BaseURL, { IMAGE_BASE_URL } from '../components/ApiCreds';
import Loader from '../components/Loader';
import dynamicfunctions from '../utils/dynamicfunctions';
import html2canvas from 'html2canvas';
import { ArrowLeft } from 'lucide-react';
import '@fortawesome/fontawesome-free/css/all.min.css';

const RecordButton = (props) => {
  return (
    <button
      disabled={props.disabled}
      onClick={() => props.onPress()}
      style={styles.recordButton}
      aria-label="Record"
    >
      {'\u2B24'} {props.title}
    </button>
  );
};

const EndButton = (props) => {
  return (
    <button onClick={() => props.onPress()} style={styles.endButton}>
      {props.title}
    </button>
  );
};

const NextButton = (props) => {
  return (
    <button onClick={() => props.onPress()} style={styles.nextButton}>
      {props.title}
    </button>
  );
};

const PrevButton = (props) => {
  return (
    <button onClick={() => props.onPress()} style={styles.prevBtn}>
      {props.title}
    </button>
  );
};

const PlayButton = (props) => {
  return (
    <div
      style={{
        borderWidth: '2px',
        borderColor: '#FC4343',
        marginBottom: '10%',
        padding: '5px',
        borderRadius: '100%',
        marginTop: '20px',
        display: 'inline-block',
      }}
    >
      <button
        disabled={props.disabled}
        onClick={() => props.onPress()}
        style={styles.playButton}
        aria-label="Play"
      >
        <WaveSVG />
      </button>
    </div>
  );
};

const SpeechArticulationPage = () => {
  const location = useLocation(); // Get the location object
  const { sessionId, isAll } = location?.state || {}; // Use fallback if state is undefined
  console.log(location?.state)

  const { setArticulationReport } = useDataContext();
  const [startTime, setStartTime] = useState('');
  const [hack, doHack] = useState(0);
  const [questionData, setQuestionData] = useState(null);
  const [isVideoEnd, setIsVideoEnd] = useState(false);
  const [snapshot, setSnapshot] = useState(null);
  const [disableRecordingButton, setDisableRecordingButton] = useState(false);
  const [expression, setExpression] = useState(null);
  const [expressionsArray, setExpressionsArray] = useState([]);
  const [videoUrl, setVideoUrl] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [userId, setUserId] = useState(null);
  const cameraRef = useRef(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [result, setResult] = useState("");
  // Ref for camera
  const mediaRecorderRef = useRef(null); // Ref for the MediaRecorder API
  const audioChunksRef = useRef([]);
  const User = () => localStorage.getItem("userId");
  const storedUserDetail = () => localStorage.getItem("userDetails");
  useEffect(() => {
    const fetchData = () => {
      try {
        // Retrieve user details and userId from localStorage
        const storedUserDetail = localStorage.getItem("userDetails");
        const storedUserId = User(); // This is synchronous, no need for await

        // Check if user details exist in localStorage
        if (storedUserDetail) {
          setUserDetail(JSON.parse(storedUserDetail)); // Parse JSON and set in state
        }

        if (storedUserId) {
          setUserId(storedUserId); // Set userId (no need to parse if it's a string)
        }
      } catch (error) {
        console.error("Error retrieving or parsing userDetails from localStorage", error);
      }
    };

    fetchData(); // Call the function inside useEffect
    console.log(User());
  }, []); // Empty dependency array ensures this runs only once when the component mounts


  const {
    correctAnswersCount,
    correctExpressions,
    correctQuestions,
    incorrectExpressions,
    incorrectQuestions,
    onCorrectAnswer,
    onCorrectExpression,
    onWrongAnswer,
    onWrongExpression,
    questionCount,
    questionResponse,
    recordingStatus,
    setQuestionCount,
    setQuestionResponse,
    setRecordingStatus
  } = dynamicfunctions({})

  const webcamRef = useRef(null);
  const videoRef = useRef(null);
  const navigate = useNavigate();

  const percentageCompleted = (questionCount / 44) * 100;



  // Update the navigateTo function in SpeechArticulationPage
  const navigateTo = () => {
    const navigationState = {
      sessionId,
      isAll,
      totalQuestions: 44,
      isExpressive: true,
      SessiontypId: 1,
      startTime,
      correctAnswers: correctAnswersCount || 0,
      incorrectAnswers: incorrectQuestions?.length || 0,
      expressionsArray: expressionsArray || [],
      incorrectExpressions: incorrectExpressions || [],
      correctExpressions: correctExpressions || [],
      isQuick: false,
      incorrectQuestions: incorrectQuestions || [],

    };
    console.log(navigationState)
    setArticulationReport(incorrectQuestions);

    navigate('/resultReport', {
      state: navigationState,
      replace: true  // Use replace to prevent going back to the assessment
    });
  };

  const navigateBack = () => {
    navigate(-1);
  };

  const fetchQuestionData = async (id) => {
    const token = await getToken();
    const userDetail = JSON.parse(storedUserDetail());
    try {
      if (questionCount <= 44) {
        const response = await fetch(`${BaseURL}/get_assess_word/${id}/${userDetail?.AvatarID}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data) {
          console.log(data);
          setQuestionData(data);
          setVideoUrl(data?.AvatarVideoPath);
        }
      }
    } catch (error) {
      console.error('Network request failed:', error);
    }
  };
  useEffect(() => {
    const currentStartTime = new Date()
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');
    setStartTime(currentStartTime);
  }, []);


  useEffect(() => {
    if (questionCount <= 44) {
      fetchQuestionData(questionCount);
    }
  }, [questionCount]);



  const onStartRecord = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        // Start audio recording
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(audioStream);
        const audioChunks = []; // This will store audio data chunks

        mediaRecorderRef.current.ondataavailable = (e) => {
          audioChunks.push(e.data); // Store audio data as chunks
        };

        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          setAudioUrl(URL.createObjectURL(audioBlob)); // Set the audio URL for playback
          console.log("audioUrl", audioUrl);
          audioChunks.length = 0; // Reset chunks after recording stops

          // Send audio after recording is stopped
          sendAudio(audioBlob); // Pass the audio blob directly
        };

        mediaRecorderRef.current.start();
        setRecordingStatus('recording'); // Update recording status to 'recording'

        // Start video recording
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        cameraRef.current = new MediaRecorder(videoStream);

        cameraRef.current.ondataavailable = (e) => {
          const videoBlob = e.data; // This is the actual video blob
          sendVideo(videoBlob); // Send the video blob directly
        };

        cameraRef.current.onstop = () => {
          // You can implement any necessary cleanup here after the video recording stops
        };

        cameraRef.current.start(); // Start video recording
      } catch (error) {
        console.error('Error starting media recording:', error);
      }
    }
  };
  // Stop recording both audio and video
  const onStopRecord = async () => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (cameraRef.current && cameraRef.current.state === 'recording') {
        cameraRef.current.stop();
      }
      setRecordingStatus('stopped');
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

  // Send the recorded video file to the server
  const sendVideo = async (videoBlob) => {
    const token = await getToken();
    const fileName = `${sessionId}_${questionCount}.mp4`;

    try {
      const formData = new FormData();
      // Append the actual Blob object, not the URL
      formData.append('file', videoBlob, fileName);

      const response = await fetch(`${BaseURL}/upload_video_articulation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      // Check if the response is successful (status 200-299)
      if (!response.ok) {
        // If the response is not OK, read the response as text to log the error
        const errorText = await response.text();
        console.error('Upload failed:', errorText);
        return;
      }

      // Check if the response is JSON
      const contentType = response.headers.get('Content-Type');
      let result;

      if (contentType && contentType.includes('application/json')) {
        // If the response is JSON, parse it
        result = await response.json();
        console.log('Video uploaded successfully:', result);
      } else {
        // If it's not JSON, treat it as plain text
        const text = await response.text();
        console.log('Server response (non-JSON):', text);
      }
    } catch (error) {
      console.error('Error uploading video:', error);
    }
  };
  const cameraContainerRef = useRef(null);


  const capture = () => {
    return new Promise((resolve, reject) => {
      if (cameraContainerRef.current) {
        html2canvas(cameraContainerRef.current)
          .then((canvas) => {
            const imageSrc = canvas.toDataURL('image/jpeg');
            console.log("imageSrc", imageSrc);
            setSnapshot(imageSrc);
            resolve(imageSrc);
          })
          .catch((error) => {
            console.error('Failed to capture image with html2canvas:', error);
            reject(error);
          });
      } else {
        reject(new Error('Camera reference not found'));
      }
    });
  };

  const sendSnapshot = async () => {
    try {
      const image = await capture();
      console.log("Captured image:", image);

      if (image && image.includes('base64')) {

        const byteString = atob(image.split(',')[1]);
        const arrayBuffer = new ArrayBuffer(byteString.length);
        const view = new Uint8Array(arrayBuffer);

        for (let i = 0; i < byteString.length; i++) {
          view[i] = byteString.charCodeAt(i);
        }

        const blob = new Blob([view], { type: 'image/jpeg' });
        const formData = new FormData();
        formData.append('image', blob, 'snapshot.jpg');

        console.log("Sending formData to API...");
        const response = await detectExpression(formData);
        console.log("Response from expression api:", response);

        if (response?.expression) {
          setExpression(response.expression);
          console.log('Expression detected:', response.expression);
          return response.expression;
        }
      } else {
        console.error('Invalid image data received:', image);
      }
      return null;
    } catch (error) {
      console.error('Failed to take snapshot or detect expression:', error);
      return null;
    }
  };

  // Function to detect the expression (Assumed API function)
  const detectExpression = async (formData) => {
    try {

      const token = await getToken(); // Get the authorization token
      const response = await fetch(`${BaseURL}/detect_expression`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`, // Add the authorization header
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Expression API full response:", data);
      return data;
    } catch (error) {
      console.error('Error detecting expression:', error);
      return null;
    }
  };

  // Function to send audio
  // Updated sendAudio function with proper error handling
  const sendAudio = async (audioBlob) => {
    if (!audioBlob) {
      console.error('Audio blob is not defined');
      setRecordingStatus('stop');
      onWrongAnswer(questionData, questionData?.WordText);
      setResult("UnMatched");
      return;
    }

    try {
      const token = await getToken();
      const formData = new FormData();

      // Log the audio blob details for debugging
      console.log('Processing audio:', {
        size: audioBlob.size,
        type: audioBlob.type
      });

      formData.append('audio', audioBlob, 'recorded_audio.wav');
      formData.append('text', questionData?.WordText || '');

      const response = await fetch(`${BaseURL}/process_speech`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      // Log the raw response for debugging
      console.log('Server response:', response);

      // Parse the response
      const result = await response.json();
      console.log('Processing speech response:', result);

      // Handle the result based on the message
      if (result && typeof result.message === 'string') {
        if (result.message.toLowerCase() === 'matched') {
          onCorrectAnswer(questionData?.WordText);
          setResult("Matched");
        } else {
          // This is a valid response, just not a match
          onWrongAnswer(questionData, questionData?.WordText);
          setResult("UnMatched");
        }
        // Since we got a valid response, don't throw an error
        return;
      }

      // If we get here, the response wasn't in the expected format
      throw new Error('Invalid response format from server');

    } catch (error) {
      console.error('Error in speech processing:', error);

      // Only treat it as an upload failure if we actually failed to communicate
      // with the server or process the response
      if (!error.message.includes('Invalid response format')) {
        onWrongAnswer(questionData, questionData?.WordText);
        setResult("UnMatched");
      }
    } finally {
      // Always ensure we stop recording
      setRecordingStatus('stop');
    }
  };

  // Helper function to handle recording errors
  const handleRecordingError = (errorMessage) => {
    setRecordingStatus('stop');
    // You might want to show this error to the user through your UI
    console.error('Recording error:', errorMessage);
  };
  const endAssessment = () => {
    localStorage.setItem('sessionId', sessionId);
    localStorage.setItem('startTime', startTime);
    localStorage.setItem('correctAnswers', correctAnswersCount);
    localStorage.setItem('incorrectQuestions', JSON.stringify(incorrectQuestions));
    localStorage.setItem('expressionsArray', JSON.stringify(expressionsArray));
    localStorage.setItem('correctExpressions', JSON.stringify(correctExpressions));
    localStorage.setItem('incorrectExpressions', JSON.stringify(incorrectExpressions));

    navigateTo();
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.stop();
      videoRef.current.seek(0.1);
      videoRef.current.play();
    }
  }, [videoUrl]);

  return (
    <div className="min-h-screen bg-gray-50 p-5">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gray-800 text-white p-4 flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-700 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold ml-3">Articulation</h1>

            {/* <button
              onClick={() => {
                const navigationState = {
                  sessionId,
                  isAll,
                  correctAnswers: correctAnswersCount || 0,
                  incorrectAnswers: incorrectQuestions?.length || 0,
                  expressionsArray: expressionsArray || [],
                  incorrectExpressions: incorrectExpressions || [],
                  correctExpressions: correctExpressions || [],
                  isQuick: false
                };

                navigate('/resultReport', {
                  state: navigationState,
                  replace: true
                });
              }}
            >
              result page
            </button> */}
          </div>

          <main className="p-6">
            {/* Instructions */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-gray-600 text-center mb-6"
            >
              Place your face in the middle of the camera frame while speaking
            </motion.p>

            {/* Question Counter */}
            <p className="text-center mb-4">
              Question <span className="font-bold">{questionCount}</span> out of <span className="font-bold">44</span>
            </p>

            {/* Progress Bar */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentageCompleted}%` }}
                  className="h-full bg-green-500"
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className="text-sm text-gray-500 whitespace-nowrap">
                {percentageCompleted.toFixed(1)}%
              </span>
            </div>

            {/* Question Image */}
            {questionData && questionData.PictureUrl && (
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="flex justify-center mb-6"
              >
                <div className='flex gap-4'>
                  <img
                    className="w-48 h-48 rounded-xl shadow-lg object-cover"
                    src={`${IMAGE_BASE_URL}${questionData.PictureUrl}`}
                    alt="Question"
                  />
                  <video
                    key={videoUrl}
                    className="w-48 h-48 rounded-xl shadow-lg object-cover"
                    autoPlay
                    controls

                    playsInline
                  >
                    <source src={`${IMAGE_BASE_URL}${videoUrl}`} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>

                </div>
              </motion.div>
            )}



            {/* Question Text */}
            <p className="text-xl font-bold text-center mb-8">
              Say this: {questionData?.WordText}
            </p>

            {/* Loading State */}
            <Loader loading={recordingStatus === 'loading'} />

            {/* Expression Text */}
            {recordingStatus === 'stop' && expression && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-lg text-red-500 text-center mb-6"
              >
                Facial Expression: {expression}
              </motion.p>
            )}
            {recordingStatus === 'stop' && result && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`${result === true ? 'text-green-600 text-center serif ' : 'text-red-600 text-center serif'}`}

              >
                Voice Result: {result}
              </motion.p>
            )}

            {/* Camera View */}
            <div ref={cameraContainerRef} className="mb-8">
              <div className="rounded-2xl overflow-hidden shadow-lg mx-auto max-w-md">
                <Webcam
                  audio={false}
                  ref={cameraRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{
                    facingMode: "user",
                    width: 300,
                    height: 300,
                  }}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex justify-center items-center">
  {recordingStatus === 'idle' && (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onStartRecord}
      className="flex items-center justify-center bg-black text-white rounded-full py-4 px-6 font-semibold transition-colors mb-6"
    >
      <i className="fas fa-record-vinyl text-xl mr-2"></i>
      Start Recording
    </motion.button>
  )}

  {recordingStatus === 'recording' && (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onStopRecord}
      className="flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white rounded-full py-4 px-6 font-semibold transition-colors mb-6"
    >
      <i className="fas fa-stop text-xl mr-2"></i>
      Stop Recording
    </motion.button>
  )}
</div>


         
{/* Navigation Buttons */}
{recordingStatus === 'stop' && (
  <div className="space-y-4">
    {questionCount < 44 && (
      <div className="flex gap-4">
        {questionCount !== 1 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setRecordingStatus('idle');
              setExpression(null);
              setQuestionResponse('');
              if (questionCount >= 1) {
                setQuestionCount(prevCount => prevCount - 1);
              }
            }}
            className="flex-1 border border-gray-300 hover:bg-gray-50 rounded-full py-3 px-6 font-semibold transition-colors flex items-center justify-center"
          >
            <i className="fas fa-arrow-left mr-2 text-lg"></i> {/* Left arrow icon */}
            Previous
          </motion.button>
        )}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setRecordingStatus('idle');
            setExpression(null);
            setQuestionResponse('');
            if (questionCount <= 44) {
              setQuestionCount(prevCount => prevCount + 1);
            } else {
              endAssessment();
            }
          }}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-full py-3 px-6 font-semibold transition-colors flex items-center justify-center"
        >
          <i className="fas fa-arrow-right mr-2 text-lg"></i> {/* Right arrow icon */}
          Next
        </motion.button>
      </div>
    )}
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => endAssessment()}
      className="w-full bg-red-500 hover:bg-red-600 text-white rounded-full py-3 px-6 font-semibold transition-colors flex items-center justify-center"
    >
      <i className="fas fa-times mr-2 text-lg"></i> {/* Stop/End icon */}
      {questionCount < 44 ? 'End Now' : 'Finish'}
    </motion.button>
  </div>
)}
          </main>
        </div>
      </div>
    </div>
  );
}
export default SpeechArticulationPage