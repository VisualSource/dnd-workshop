package server

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"

	"github.com/heroiclabs/nakama-common/api"
	"github.com/heroiclabs/nakama-common/runtime"
)

/*
map[
openid.assoc_handle:1234567890
openid.claimed_id:https%3A%2F%2Fsteamcommunity.com%2Fopenid%2Fid%2F76561198185501646
openid.identity:https%3A%2F%2Fsteamcommunity.com%2Fopenid%2Fid%2F76561198185501646
openid.mode:id_res
openid.ns:http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0
openid.op_endpoint:https%3A%2F%2Fsteamcommunity.com%2Fopenid%2Flogin
openid.response_nonce:2025-11-28T21%3A12%3A14Z8gUPEJmXzo4nuJtnjDqHdl9JJR4%3D
	2025-11-28T21:12:14Z8gUPEJmXzo4nuJtnjDqHdl9JJR4=
openid.return_to:http%3A%2F%2Flocalhost%3A45665
    http://localhost:45665
openid.sig:MVTMXrCbh5GGlOvGQu5Bb1wPn%2Bs%3D
	MVTMXrCbh5GGlOvGQu5Bb1wPn+s=
openid.signed:signed%2Cop_endpoint%2Cclaimed_id%2Cidentity%2Creturn_to%2Cresponse_nonce%2Cassoc_handle
	signed,op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle
]

*/

type steamPlayer struct {
	SteamId     string `json:"steamid"`
	Avatar      string `json:"avatar"`
	AvatarFull  string `json:"avatarfull"`
	PersonaName string `json:"personaname"`
}

type steamPlayers struct {
	Players []steamPlayer `json:"players"`
}

type steamPlayerSummaries struct {
	Response steamPlayers `json:"response"`
}

func BeforeAuthenticateSteamWeb(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, in *api.AuthenticateCustomRequest) (*api.AuthenticateCustomRequest, error) {
	env := ctx.Value(runtime.RUNTIME_CTX_ENV).(map[string]string)
	apiKey := env["STEAM_WEB_API_KEY"]

	params := make(url.Values)

	params.Add("openid.ns", "http://specs.openid.net/auth/2.0")
	params.Add("openid.sig", in.Account.Vars["openid.sig"])
	for _, prop := range strings.Split(in.Account.Vars["openid.signed"], ",") {
		id := "openid." + prop

		value, ok := in.Account.Vars[id]
		if ok {
			params.Add(id, value)
		}
	}
	params.Add("openid.mode", "check_authentication")

	response, err := http.PostForm("https://steamcommunity.com/openid/login", params)
	if err != nil {
		logger.Error("request failed %s", err.Error())
		return nil, err
	}

	defer response.Body.Close()

	bytes, err := io.ReadAll(response.Body)
	if err != nil {
		logger.Error("failed to read body %s", err.Error())
		return nil, err
	}

	content := string(bytes)
	if !strings.Contains(content, "is_valid:true") {
		logger.Error("login failed")
		return nil, ErrNotAllowed
	}

	claim := strings.Split(in.Account.Vars["openid.claimed_id"], "/")
	claimId := claim[len(claim)-1]

	accountRequest, err := http.Get(fmt.Sprintf("https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=%s&steamids=%s", apiKey, claimId))
	if err != nil {
		logger.Error("failed to query user details %s", err.Error())
		return nil, ErrInternalError
	}

	defer accountRequest.Body.Close()

	payload, err := io.ReadAll(accountRequest.Body)
	if err != nil {
		logger.Error("failed to read body: %s", err.Error())
		return nil, ErrInternalError
	}

	userInfo := steamPlayerSummaries{}
	if err := json.Unmarshal(payload, &userInfo); err != nil {
		logger.Error("failed to unmarshal: %s", err.Error())
		return nil, ErrInternalError
	}

	in.Username = userInfo.Response.Players[0].PersonaName
	in.Account.Id = userInfo.Response.Players[0].SteamId

	in.Account.Vars["avatar"] = userInfo.Response.Players[0].Avatar
	in.Account.Vars["avatarfull"] = userInfo.Response.Players[0].AvatarFull

	return in, nil
}

func AfterAuthenticateSteamWeb(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, out *api.Session, in *api.AuthenticateCustomRequest) error {
	if !out.Created {
		return nil
	}

	userId, ok := ctx.Value(runtime.RUNTIME_CTX_USER_ID).(string)
	if !ok {
		logger.Error("failed to update user, do to missing user id")
		return nil
	}

	metadata := map[string]interface{}{}
	metadata["avatar_small"] = in.Account.Vars["avatar"]

	if err := nk.AccountUpdateId(ctx,
		userId,
		in.Username,
		metadata,
		"",
		"",
		"",
		"en",
		in.Account.Vars["avatarfull"]); err == nil {
		return err
	}

	return nil
}
