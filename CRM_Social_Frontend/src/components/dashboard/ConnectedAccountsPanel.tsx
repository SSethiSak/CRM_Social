import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useApp } from "@/context/AppContext";
import {
  PlatformIcon,
  platformGlowColors,
  platformBorderColors,
  getPlatformName,
} from "@/components/shared/PlatformIcon";
import { formatRelativeTime } from "@/lib/formatters";
import { Link2, ExternalLink, Unlink, Loader2 } from "lucide-react";
import type { Platform } from "@/types/social";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

export function ConnectedAccountsPanel() {
  const {
    connectedAccounts,
    connectAccount,
    disconnectAccount,
    refreshAccounts,
  } = useApp();
  const [connectingPlatform, setConnectingPlatform] = useState<Platform | null>(
    null
  );

  // Telegram dialog state
  const [telegramDialogOpen, setTelegramDialogOpen] = useState(false);
  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [telegramChannelId, setTelegramChannelId] = useState("");
  const [telegramError, setTelegramError] = useState("");
  const [telegramLoading, setTelegramLoading] = useState(false);

  const handleConnect = async (platform: Platform) => {
    if (platform === "telegram") {
      setTelegramDialogOpen(true);
      return;
    }

    setConnectingPlatform(platform);
    try {
      await connectAccount(platform);
    } catch (error) {
      console.error(`Failed to connect ${platform}:`, error);
    }
    setConnectingPlatform(null);
  };

  const handleTelegramConnect = async () => {
    setTelegramError("");
    setTelegramLoading(true);

    try {
      await api.connectTelegram(telegramBotToken, telegramChannelId);
      setTelegramDialogOpen(false);
      setTelegramBotToken("");
      setTelegramChannelId("");
      await refreshAccounts();
    } catch (error: any) {
      setTelegramError(error.message || "Failed to connect Telegram channel");
    } finally {
      setTelegramLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Connected Accounts
        </h1>
        <p className="text-slate-400">
          Manage your social media platform connections
        </p>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {connectedAccounts.map((account) => (
          <Card
            key={account.id}
            className={cn(
              "relative bg-slate-900/50 border-slate-800/50 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:scale-[1.02]",
              account.isConnected && platformGlowColors[account.platform],
              account.isConnected &&
                `border-2 ${platformBorderColors[account.platform]}`
            )}
          >
            {/* Glow effect */}
            {account.isConnected && (
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/5 pointer-events-none" />
            )}

            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "p-3 rounded-xl transition-all duration-300",
                      account.isConnected
                        ? "bg-slate-800/80"
                        : "bg-slate-800/30"
                    )}
                  >
                    <PlatformIcon platform={account.platform} size={32} />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-white">
                      {getPlatformName(account.platform)}
                    </CardTitle>
                    <p
                      className={cn(
                        "text-sm",
                        account.isConnected
                          ? "text-slate-300"
                          : "text-slate-500"
                      )}
                    >
                      {account.accountName}
                    </p>
                  </div>
                </div>
                {/* Status indicator */}
                <div
                  className={cn(
                    "w-3 h-3 rounded-full mt-1",
                    account.isConnected
                      ? "bg-green-400 shadow-lg shadow-green-400/50 animate-pulse"
                      : "bg-slate-600"
                  )}
                />
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Connection status */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Status</span>
                <span
                  className={cn(
                    "font-medium",
                    account.isConnected ? "text-green-400" : "text-slate-400"
                  )}
                >
                  {account.isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>

              {/* Last activity */}
              {account.isConnected && account.lastActivity && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Last activity</span>
                  <span className="text-slate-300">
                    {formatRelativeTime(account.lastActivity)}
                  </span>
                </div>
              )}

              {/* Action buttons */}
              <div className="pt-2">
                {account.isConnected ? (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700/50 hover:text-white"
                      onClick={() => {
                        const url =
                          account.platform === "telegram"
                            ? "https://t.me"
                            : `https://${account.platform}.com`;
                        window.open(url, "_blank");
                      }}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-slate-800/50 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                      onClick={() => disconnectAccount(account.id)}
                    >
                      <Unlink className="w-4 h-4 mr-1" />
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-medium shadow-lg shadow-blue-500/25 border-0"
                    onClick={() => handleConnect(account.platform)}
                    disabled={connectingPlatform === account.platform}
                  >
                    {connectingPlatform === account.platform ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Link2 className="w-4 h-4 mr-2" />
                        Connect {getPlatformName(account.platform)}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* OAuth Info */}
      <Card className="bg-slate-900/30 border-slate-800/30 backdrop-blur-sm">
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400">
              <Link2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-medium text-white">OAuth Connection</h3>
              <p className="text-sm text-slate-400">
                When you click "Connect", you'll be redirected to the platform's
                authorization page. After granting permission, your account will
                be securely linked to the Command Center.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Telegram Connection Dialog */}
      <Dialog open={telegramDialogOpen} onOpenChange={setTelegramDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlatformIcon platform="telegram" size={24} />
              Connect Telegram Channel
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Enter your bot token and channel ID to connect your Telegram
              channel.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="botToken" className="text-slate-300">
                Bot Token
              </Label>
              <Input
                id="botToken"
                placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                value={telegramBotToken}
                onChange={(e) => setTelegramBotToken(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
              <p className="text-xs text-slate-500">
                Get this from{" "}
                <a
                  href="https://t.me/botfather"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  @BotFather
                </a>{" "}
                on Telegram
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="channelId" className="text-slate-300">
                Channel ID
              </Label>
              <Input
                id="channelId"
                placeholder="@yourchannel or -1001234567890"
                value={telegramChannelId}
                onChange={(e) => setTelegramChannelId(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
              <p className="text-xs text-slate-500">
                Your channel username (with @) or numeric ID. Bot must be admin
                with "Post Messages" permission.
              </p>
            </div>

            {telegramError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {telegramError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTelegramDialogOpen(false)}
              className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleTelegramConnect}
              disabled={
                !telegramBotToken || !telegramChannelId || telegramLoading
              }
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white"
            >
              {telegramLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect Channel"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
