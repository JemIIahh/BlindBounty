import { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { ethers } from 'ethers';

declare global {
  interface Window {
    phantom?: {
      ethereum?: any;
    };
  }
}

const PROVIDERS = {
  openai: { label: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'] },
  anthropic: { label: 'Anthropic', models: ['claude-opus-4-5', 'claude-sonnet-4-5', 'claude-3-haiku-20240307'] },
  groq: { label: 'Groq', models: ['llama-3.3-70b-versatile', 'llama3-8b-8192', 'mixtral-8x7b-32768'] },
  gemini: { label: 'Gemini', models: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'] },
} as const;

type Provider = keyof typeof PROVIDERS;

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletConnectModal({ isOpen, onClose }: WalletConnectModalProps) {
  const { connecting } = useWallet();
  const { authenticating } = useAuth();
  const [selectedWallet, setSelectedWallet] = useState<'phantom' | 'metamask' | 'auto'>('phantom');

  if (!isOpen) return null;

  const handleConnect = () => {
    alert('Button works!');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Connect Wallet</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Choose your wallet to connect.
          </p>

          {/* Wallet Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wallet
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedWallet('phantom')}
                className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                  selectedWallet === 'phantom'
                    ? 'border-purple-600 bg-purple-50 text-purple-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                Phantom
              </button>
              <button
                type="button"
                onClick={() => setSelectedWallet('metamask')}
                className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                  selectedWallet === 'metamask'
                    ? 'border-orange-600 bg-orange-50 text-orange-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                MetaMask
              </button>
              <button
                type="button"
                onClick={() => setSelectedWallet('auto')}
                className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                  selectedWallet === 'auto'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                Auto
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConnect}
              disabled={connecting || authenticating}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {connecting || authenticating ? 'Connecting...' : 'Connect'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}