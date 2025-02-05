'use client';

import { JSX } from "react";
import Link from "next/link";

// Hooks
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Components
import OnchainKitWallet from "../OnchainKitWallet";

const Navigation: React.FunctionComponent = (): JSX.Element => {

  const path = usePathname();
  const router = useRouter();
  const { isConnected } = useAccount();

  useEffect(() => {
    if (!isConnected && path !== '/') {
      router.push('/')
    }
  }, [isConnected])

  return (
    <>
      {path !== '/' && (
        <nav className="max-w-2xl mx-auto space-y-8 top-0 bg-white rounded-lg shadow-md p-4 z-50 mb-8">
          <ul className="flex items-center justify-center space-x-8">
              <li><Link href="/dashboard" className={path === "/dashboard" ? "active" : ""}>Dashboard</Link></li>
              <li><Link href="/transactions" className={path === "/transactions" ? "active" : ""}>Transactions</Link></li>
              <li><Link href="/settings" className={path === "/settings" ? "active" : ""}>Settings</Link></li>
              <li><Link href="/faq" className={path === "/faq" ? "active" : ""}>FAQ</Link></li>
              <li><OnchainKitWallet /></li>
          </ul>
        </nav>
      )}
    </>
  )
}

export default Navigation;