import { Nakama } from "@/lib/nakama";
import { useQuery } from "@tanstack/react-query";

export const useAccount = () => {
	const { data, isError, error, isLoading } = useQuery({
		queryKey: ["user", "self"],
		queryFn: async () => {
			const nakama = Nakama.get();

			const user = await nakama.getAccount();
			return user;
		},
	});

	return {
		user: data,
		isError,
		error,
		isLoading,
	};
};

export const useUser = (userId: string) => {
	const { data, isError, isLoading, error } = useQuery({
		queryKey: ["user", userId],
		queryFn: async () => {
			const nakama = Nakama.get();

			const { users } = await nakama.getUsers([userId]);
			const user = users?.at(0);
			if (!user) throw new Error(`Failed to get user with id "${userId}"`);

			return user;
		},
	});

	return {
		user: data,
		isError,
		isLoading,
		error,
	};
};

export const useUsers = (userIds: string[]) => {
	const { data, isError, error, isLoading } = useQuery({
		queryKey: ["users", userIds],
		queryFn: async () => {
			const nakama = Nakama.get();

			const { users } = await nakama.getUsers(userIds);
			if (!users) throw new Error("Failed to fetch users");

			return users;
		},
	});

	return {
		users: data,
		isError,
		error,
		isLoading,
	};
};
