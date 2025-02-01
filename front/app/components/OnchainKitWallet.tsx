import { JSX } from "react"

// OnchainKit components
import { Wallet, ConnectWallet, WalletDropdown, WalletDropdownDisconnect } from "@coinbase/onchainkit/wallet"
import { Identity, Avatar, Address, EthBalance, Name } from "@coinbase/onchainkit/identity"

const OnchainKitWallet: React.FunctionComponent = (): JSX.Element => {
  return (
    <div>
      <Wallet>
        <ConnectWallet>
          <Avatar className="h-6 w-6" />
          <Name />
        </ConnectWallet>
        <WalletDropdown>
          <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
            <Avatar />
            <Name />
            <Address />
            <EthBalance />
          </Identity>
          <WalletDropdownDisconnect />
        </WalletDropdown>
      </Wallet>
    </div>
  )
}

export default OnchainKitWallet