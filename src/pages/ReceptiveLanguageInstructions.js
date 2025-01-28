import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CustomHeader from '../components/CustomHeader';
import { Button } from '@mui/material';

function ReceptiveLanguageInstructions() {
    const location = useLocation();
    const { sessionId, isAll } = location.state || {};
    console.log(location.state);
    const history = useNavigate();

    const navigate = () => {
        history('/ReceptiveAssessment', { state: { sessionId, isAll } });
    };




    return (
        <div className="flex flex-col min-h-screen">
            <CustomHeader
                title="Receptive Language Disorder"
                goBack={() => history(-1)}
            />

            <main className="flex-1 p-5 flex flex-col items-center  bg-white shadow-lg rounded-lg md:m-20 m-0">
                {/* Image container */}
                <div className="mt-10">
                    <img
                        src={require("../assets/images/mouth.png")}
                        alt="Mouth"
                        className="h-40 w-auto"
                    />
                </div>

                {/* Heading */}
                <h2 className="text-xl font-medium italic  mt-12 font-serif text-gray-900">
                    Assessment Instructions
                </h2>

                {/* Instructions list - centered with max-width */}
                <div className="space-y-4 h-[30vh] mt-6 max-w-md mx-auto w-full">
                    <div className="flex items-start gap-3 ">
                        <span className="text-teal-500 text-[20px] animate-pulse glow">•</span>
                        <p className="text-gray-900 font-serif">
                            You are required to select one picture in each set.
                        </p>
                    </div>

                    <div className="flex items-start gap-3 ">
                        <span className="text-teal-500 text-[20px] animate-pulse glow">•</span>
                        <p className="text-gray-900 font-serif">
                            There is no pass or fail criteria .
                        </p>
                    </div>

                    <div className="flex items-start gap-3 ">
                        <span className="text-teal-500 text-[20px] animate-pulse glow">•</span>
                        <p className="text-gray-900 font-serif">
                            Select the picture as per your understanding.
                        </p>
                    </div>
                </div>

                {/* Start button - centered */}
                <div className="mt-8 w-full max-w-xs flex justify-end">
  <button
    className="bg-black hover:bg-gray-800 text-white pl-16 pr-16 pt-2 pb-2 rounded-full"
    onClick={navigate}
  >
    Start Now
  </button>
</div>
            </main>
        </div>
    );
}

export default ReceptiveLanguageInstructions;