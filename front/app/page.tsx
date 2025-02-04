'use client';

// Hooks
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Components
import OnchainKitWallet from "./components/OnchainKitWallet";

export default function Home() {

  const router = useRouter();
  const { isConnected } = useAccount();

  useEffect(() => {
    if (isConnected) {
      router.push('/dashboard')
    }
  }, [isConnected])

  return (
    <div className="min-h-screen max-h-screen py-20 px-80 relative overflow-hidden">
      <div className="text-white relative z-10">
        <h1 className="text-6xl">Onchain Buddy</h1>
        <p className="mt-12 w-1/2">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean placerat euismod tempor. Donec sit amet est suscipit, suscipit arcu eu, bibendum magna. Ut suscipit nisi eu enim elementum ultrices. Sed in arcu tempus, finibus odio eget, sodales libero. Nam tortor eros, faucibus quis ante non, lacinia blandit massa.</p>
        <p className="mt-12">V - Main objective...</p>
        <div className="mt-12">
          <OnchainKitWallet/>
        </div>
      </div>
      <div className="absolute bottom-60 right-60 -mb-20 -mr-20">
        <img 
          src="image_robot_onchainbuddy.png" 
          alt="Robot Onchain Buddy"
          className="w-[900px] h-auto"
        />
      </div>
    </div>
  );
}
