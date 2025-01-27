import React from 'react';
import { ArrowRight } from 'lucide-react';
import CustomHeader from '../../components/CustomHeader';
import { useNavigate } from 'react-router-dom';
import TherapistImage from '../../assets/images/TherapistImage.png';

function Card({ navigate, isAvatar }) {
  const handleClick = () => {
    navigate(isAvatar ? "/AvatarTherapistName" : '/therapistProfile', {
      state: {
        itemId: 86,
        otherParam: 'anything you want here',
      }
    });
  };

  return (
    <button onClick={handleClick} className="w-full">
      <div className="relative mt-4 rounded-2xl p-0.5 bg-gradient-to-br from-[#0CC8E8] to-[#2DEEAA]">
        <div className="flex items-center justify-between gap-4 p-4 bg-white rounded-2xl">
          <div className="flex items-center">
            <div className="h-16 w-16 rounded-full bg-[#D6D8C0]">
              <img
                src={TherapistImage}
                alt="Therapist"
                className="h-full w-full rounded-full object-cover"
              />
            </div>
            <div className="ml-3">
              <h3 className="text-xl text-left font-medium text-[#111920]">IzzyAI</h3>
              <p className="text-sm font-medium text-[#111920]">
                {isAvatar ? "Conversational Avatar" : "Chatbot"}
              </p>
            </div>
          </div>
          <ArrowRight className="text-[#2DEEAA]" />
        </div>
      </div>
    </button>
  );
}

export default function TherapistsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <CustomHeader title="Articulation Disorder" goBack={() => navigate(-1)} />
      <main className="p-5">
        <h2 className="text-2xl font-medium text-[#111920] my-5">
          List of therapists you can choose from!
        </h2>
        <Card navigate={navigate} />
        <Card navigate={navigate} isAvatar />
      </main>
    </div>
  );
}