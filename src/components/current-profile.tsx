import { useAccount } from "@/hooks/use-account";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export const CurrentProfile: React.FC = () => {
	const { user } = useAccount();
	return (
		<>
			<Avatar className="h-8 w-8 rounded-lg">
				<AvatarImage src={user?.user?.avatar_url} alt={user?.user?.username} />
				<AvatarFallback className="rounded-lg">CN</AvatarFallback>
			</Avatar>
			<div className="grid flex-1 text-left text-sm leading-tight">
				<span className="truncate font-medium">
					{user?.user?.display_name ?? user?.user?.username}
				</span>
				<span className="truncate text-xs italic text-muted-foreground">
					{user?.user?.id}
				</span>
			</div>
		</>
	);
};
