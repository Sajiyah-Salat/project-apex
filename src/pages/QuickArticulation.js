import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useDataContext } from '../contexts/DataContext';
import { getToken } from "../utils/functions";
import { useNavigate, useLocation } from 'react-router-dom';
import BaseURL, { IMAGE_BASE_URL } from '../components/ApiCreds';
import Loader from '../components/Loader';
import dynamicfunctions from '../utils/dynamicfunctions';
import { ArrowLeft } from 'lucide-react';


// Button Components
const EndButton = ({ onPress, title }) => (
    <button
        onClick={onPress}
        className="w-[42%] rounded-3xl flex items-center justify-center bg-red-500 p-3 h-[50px]"
    >
        <span className="text-white font-semibold">{title}</span>
    </button>
);

const NextButton = ({ onPress, title }) => (
    <button
        onClick={onPress}
        className="w-[42%] rounded-[50px] flex items-center justify-center bg-[#71D860] p-3 h-[50px]"
    >
        <span className="text-[#111920] font-semibold">{title}</span>
    </button>
);

const PrevButton = ({ onPress, title }) => (
    <button
        onClick={onPress}
        className="w-[42%] rounded-[50px] flex items-center justify-center border border-solid p-3 h-[50px]"
    >
        <span className="text-[#111920] font-semibold">{title}</span>
    </button>
);

// Progress Bar Component
const LinearProgress = ({ value, color }) => (
    <div className="relative w-full h-2 bg-gray-200 rounded-2xl overflow-hidden">
        <div
            className="absolute top-0 left-0 h-full bg-[#FF7A2F] transition-all duration-300 ease-in-out rounded-2xl"
            style={{ width: `${value * 100}%` }}
        />
    </div>
);

// Loader Wave Component
const LoaderWave = ({ isAnimation, isDark }) => (
    <div className={`flex items-center justify-center gap-1 ${isAnimation ? 'animate-pulse' : ''}`}>
        {[...Array(5)].map((_, i) => (
            <div
                key={i}
                className={`w-1 h-4 ${isDark ? 'bg-gray-800' : 'bg-gray-400'} rounded-full transform transition-all duration-150`}
                style={{
                    animation: isAnimation ? `wave 1s infinite ${i * 0.1}s` : 'none'
                }}
            />
        ))}
    </div>
);

const SpeechArticulationPage = () => {
    const location = useLocation();
    const { sessionId, isAll } = location?.state || {};
    console.log(location.state)
    const [recordingStatus, setRecordingStatus] = useState('idle');
    const { setArticulationReport } = useDataContext();
    const [startTime, setStartTime] = useState('');
    const [questions, setQuestions] = useState(null);
    const [audioUrl, setAudioUrl] = useState('');
    const [result, setResult] = useState("");
    const mediaRecorderRef = useRef(null);
    const [userDetail, setUserDetail] = useState(null);
    const [userId, setUserId] = useState(null);
    const [questionResponse, setQuestionResponse] = useState('');
    const [questionCount, setQuestionCount] = useState(1);
    const [incorrectQuestions, setIncorrectQuestions] = useState([]);
    const [correctQuestions, setCorrectQuestions] = useState([]);
    const [correctAnswersCount, setCorrectAnswersCount] = useState(0);

    const User = () => localStorage.getItem("userId");
    const storedUserDetail = () => localStorage.getItem("userDetails");



    const navigate = useNavigate();
    const percentageCompleted = (questionCount / 44) * 100;

    // Initialize user details from localStorage
    useEffect(() => {
        const fetchData = () => {
            try {
                const storedUserDetail = localStorage.getItem("userDetails");
                const storedUserId = User();

                if (storedUserDetail) {
                    setUserDetail(JSON.parse(storedUserDetail));
                }

                if (storedUserId) {
                    setUserId(storedUserId);
                }
            } catch (error) {
                console.error("Error retrieving user details:", error);
            }
        };

        fetchData();
    }, []);

    // Navigation function
    const navigateTo = () => {
        const navigationState = {
            sessionId: sessionId,
            startTime: startTime,
            SessiontypId: 1,
            correctAnswers: correctAnswersCount,
            incorrectAnswers: incorrectQuestions.length,
            incorrectQuestions: incorrectQuestions,
            isQuick: true
        };
        console.log(navigationState)

        setArticulationReport(incorrectQuestions);
        navigate('/resultReport', {
            state: navigationState,
            replace: true
        });
    };

    // Fetch question data
    const fetchQuestions = async () => {
        console.log('Fetch Question')
        const token = await getToken();
        try {
            // setIsLoading(true);
            const response = await fetch(`${BaseURL}/get_artic_quick_assessment`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            console.log(data.questions.length)
            if (data) {
                setQuestions(data?.questions);
            }
        } catch (error) {
            console.error('Error fetching questions:', error);
        } finally {
            // setIsLoading(false);
        }
    };

    // Initialize start time
    useEffect(() => {
        const currentStartTime = new Date()
            .toISOString()
            .slice(0, 19)
            .replace('T', ' ');
        setStartTime(currentStartTime);
    }, []);

    // Fetch question data when count changes
    useEffect(() => {

        fetchQuestions(questionCount);

    }, []);

    // Audio recording functions
    const onStartRecord = async () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorderRef.current = new MediaRecorder(audioStream);
                const audioChunks = [];

                mediaRecorderRef.current.ondataavailable = (e) => {
                    audioChunks.push(e.data);
                };

                mediaRecorderRef.current.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    setAudioUrl(URL.createObjectURL(audioBlob));
                    sendAudio(audioBlob);
                };

                mediaRecorderRef.current.start();
                setRecordingStatus('recording');
            } catch (error) {
                console.error('Error starting audio recording:', error);
            }
        }
    };

    const onStopRecord = async () => {
        try {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
            setRecordingStatus('stopped');
        } catch (error) {
            console.error('Error stopping recording:', error);
        }
    };

    // Send audio for processing
    const sendAudio = async (audioBlob) => {
        if (!audioBlob) {
            console.error('Audio blob is not defined');
            setRecordingStatus('stop');
            setQuestionResponse("UnMatched");
            return;
        }

        try {
            const token = await getToken();
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recorded_audio.wav');
            formData.append('text', questions?.[questionCount - 1]?.wordtext || '');

            const response = await fetch(`${BaseURL}/process_speech`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });
            console.log(response)
            console.log(response.ok)

            if (response.ok) {
                const result = await response.json();
                if (result?.message?.toLowerCase() === 'matched') {
                    setQuestionResponse("Matched");
                    setCorrectAnswersCount(prevCount => prevCount + 1);

                    // Handle correct answer
                    if (!correctQuestions.includes(questions?.[questionCount - 1]?.id)) {
                        setCorrectQuestions(prevQuestions => [
                            ...prevQuestions,
                            questions?.[questionCount - 1]?.id,
                        ]);
                    }

                    // Remove from incorrect questions if it was there
                    if (incorrectQuestions.some(q => q?.id === questions?.[questionCount - 1]?.id)) {
                        setIncorrectQuestions(prevQuestions =>
                            prevQuestions.filter(q => q?.id !== questions?.[questionCount - 1]?.id)
                        );
                    }
                } else {
                    // Handle incorrect answer
                    if (!incorrectQuestions.some(q => q?.id === questions?.[questionCount - 1]?.id)) {
                        setIncorrectQuestions(prevQuestions => [
                            ...prevQuestions,
                            questions?.[questionCount - 1]
                        ]);
                    }

                    // Remove from correct questions if it was there
                    if (correctQuestions.includes(questions?.[questionCount - 1]?.id)) {
                        setCorrectAnswersCount(prevCount => prevCount - 1);
                        setCorrectQuestions(prevQuestions =>
                            prevQuestions.filter(q => q !== questions?.[questionCount - 1]?.id)
                        );
                    }
                    setQuestionResponse('UnMatched');
                }
            } else {
                if (!incorrectQuestions.some(q => q?.id === questions?.[questionCount - 1]?.id)) {
                    setIncorrectQuestions(prevQuestions => [
                        ...prevQuestions,
                        questions?.[questionCount - 1]
                    ]);
                }

                // Remove from correct questions if it was there
                if (correctQuestions.includes(questions?.[questionCount - 1]?.id)) {
                    setCorrectAnswersCount(prevCount => prevCount - 1);
                    setCorrectQuestions(prevQuestions =>
                        prevQuestions.filter(q => q !== questions?.[questionCount - 1]?.id)
                    );
                }
                setQuestionResponse('UnMatched');

            }
            // setQuestionResponse('UnMatched');
        } catch (error) {
            console.error('Error in speech processing:', error);
            setQuestionResponse("UnMatched");
        } finally {
            console.log(correctQuestions)
            console.log(incorrectQuestions)
            setRecordingStatus('stop');
        }
    };

    const endAssessment = () => {
        localStorage.setItem('sessionId', sessionId);
        localStorage.setItem('startTime', startTime);
        localStorage.setItem('correctAnswers', correctAnswersCount);
        localStorage.setItem('incorrectQuestions', JSON.stringify(incorrectQuestions));
        navigateTo();
    };

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <header className="bg-white py-4 px-6 border-b">
                <h1 className="text-xl font-semibold text-[#111920]">
                    Quick Articulation Disorder Assessment
                </h1>
            </header>

            <main className="flex-1 p-5">
                <div className="max-w-3xl mx-auto">
                    {/* Progress Section */}
                    <div className="mb-8">
                        <p className="text-lg mb-4">
                            Assessment <span className="font-bold">{questionCount}</span> out of{' '}
                            <span className="font-bold">{questions?.length || 0}</span>
                        </p>

                        <div className="flex items-center gap-4">
                            <LinearProgress value={percentageCompleted / 100} />
                            <span className="text-sm font-medium">{percentageCompleted.toFixed(1)}%</span>
                        </div>
                    </div>

                    {/* Question Image */}
                    <div className="border border-[#0CC8E8] rounded-2xl p-5 flex justify-center mb-8">
                        {questions?.[questionCount - 1] && (
                            <img
                                src={`${IMAGE_BASE_URL}${questions[questionCount - 1].pictureurl}`}
                                alt="Question"
                                className="w-[200px] h-[200px] object-contain"
                            />
                        )}
                    </div>

                    {/* Question Text */}
                    {questions && (
                        <div className="mb-8">
                            <p className="text-lg mb-2">Say this...</p>
                            <p className="text-xl font-semibold">
                                {questions[questionCount - 1]?.wordtext}
                            </p>
                        </div>
                    )}

                    {/* Response */}
                    {recordingStatus === 'stop' && questionResponse && (
                        <div className={`p-4 rounded-lg mb-8 ${questionResponse === 'Correct!' ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                            <p className="text-lg font-semibold">{questionResponse}</p>
                        </div>
                    )}

                    {/* Recording Interface */}
                    {recordingStatus !== 'stop' && (
                        <div className="flex items-center justify-center gap-4 border-t pt-4 mt-8">
                            <LoaderWave isAnimation={recordingStatus === 'recording'} isDark={true} />

                            <button
                                disabled={recordingStatus === 'loading'}
                                onClick={() => recordingStatus === 'idle' ? onStartRecord() : onStopRecord()}
                                className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-full"
                            >
                                {recordingStatus === 'recording' ? (
                                    <div className="w-5 h-5 bg-black rounded-sm" />
                                ) : (
                                    <svg viewBox="0 0 24 24" className="w-6 h-6">
                                        <path d="M12 15c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3z" />
                                        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    {recordingStatus === 'stop' && (
                        <div className="flex flex-col items-center gap-4 mt-8">
                            {questionCount < (questions?.length || 0) && (
                                <div className="flex justify-between w-full gap-4">
                                    {questionCount !== 1 && (
                                        <PrevButton
                                            onPress={() => {
                                                setRecordingStatus('idle');
                                                setQuestionResponse('');
                                                setQuestionCount(prev => prev - 1);
                                            }}
                                            title="Previous"
                                        />
                                    )}
                                    <NextButton
                                        onPress={() => {
                                            setRecordingStatus('idle');
                                            setQuestionResponse('');
                                            if (questionCount < questions?.length) {
                                                setQuestionCount(prev => prev + 1);
                                            } else {
                                                endAssessment();
                                            }
                                        }}
                                        title="Next"
                                    />
                                </div>
                            )}
                            <EndButton
                                onPress={endAssessment}
                                title={questionCount < (questions?.length || 0) ? "End Now" : "Finish"}
                            />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default SpeechArticulationPage;