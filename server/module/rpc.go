package server

import (
	"context"
	"database/sql"
	"encoding/json"

	"github.com/heroiclabs/nakama-common/runtime"
)

type createMatchPayload struct {
	Version string
}

type createdMatchResultPayload struct {
	MatchId string
}

func StartSessionRpc(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {

	var p createMatchPayload
	if err := json.Unmarshal([]byte(payload), &p); err != nil {
		return "", runtime.NewError("unable to unmarshal payload", INTERNAL)
	}

	params := make(map[string]interface{})
	params["version"] = p.Version

	label, err := nk.MatchCreate(ctx, "session-handler", params)

	if err != nil {
		return "", runtime.NewError(err.Error(), INTERNAL)
	}

	result := createdMatchResultPayload{
		MatchId: label,
	}

	response, err := json.Marshal(result)
	if err != nil {
		return "", runtime.NewError("unable to marshal payload", 13)
	}

	return string(response), nil
}
