package server

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/heroiclabs/nakama-common/runtime"
)

type MatchState struct {
	presences  map[string]runtime.Presence
	dm         string
	appVersion string
}

type Match struct{}

func NewMatch(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule) (m runtime.Match, err error) {

	return &Match{}, nil
}

func (m *Match) MatchInit(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, params map[string]interface{}) (interface{}, int, string) {
	state := &MatchState{
		presences: make(map[string]runtime.Presence),
	}

	tickRate := 30
	label := fmt.Sprintf("%s:%s", "", "")

	return state, tickRate, label
}

// MatchJoin implements runtime.Match.
func (m *Match) MatchJoin(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, presences []runtime.Presence) interface{} {
	mState, _ := state.(*MatchState)

	for _, p := range presences {
		mState.presences[p.GetUserId()] = p
	}

	return mState

}

// MatchJoinAttempt implements runtime.Match.
func (m *Match) MatchJoinAttempt(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, presence runtime.Presence, metadata map[string]string) (interface{}, bool, string) {
	mState, _ := state.(*MatchState)
	acceptUser := true

	reason := ""

	clientVersion, ok := metadata["version"]
	if !ok {
		return state, false, "missing metadata: 'version'"
	}

	if clientVersion != mState.appVersion {
		acceptUser = false
		reason = fmt.Sprintf("Mismatch in client versions. Was expecting '%s' but was given '%s'", mState.appVersion, clientVersion)
	}

	return state, acceptUser, reason

}

// MatchLeave implements runtime.Match.
func (m *Match) MatchLeave(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, presences []runtime.Presence) interface{} {
	mState, _ := state.(*MatchState)

	endMatch := false

	for _, p := range presences {
		userId := p.GetUserId()

		delete(mState.presences, userId)

		if userId == mState.dm {
			endMatch = true
		}
	}

	if endMatch {
		return nil
	}

	return mState

}

// MatchLoop implements runtime.Match.
func (m *Match) MatchLoop(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, messages []runtime.MatchData) interface{} {

	return state
}

// MatchSignal implements runtime.Match.
func (m *Match) MatchSignal(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, data string) (interface{}, string) {
	return state, ""
}

// MatchTerminate implements runtime.Match.
func (m *Match) MatchTerminate(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, graceSeconds int) interface{} {

	return state
}
