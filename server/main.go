package main

import (
	"context"
	"database/sql"

	"github.com/heroiclabs/nakama-common/runtime"
	core "io.github.visualsource/dnd-workshop/module"
)

func InitModule(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, initializer runtime.Initializer) error {
	

	if err := initializer.RegisterMatch("session-handler",core.NewMatch); err != nil {
		logger.Error("[RegisterMatch] error: ",err.Error())
		return err 
	}
	
	if err := initializer.RegisterBeforeAuthenticateCustom(core.BeforeAuthenticateSteamWeb); err != nil {
		logger.Error("[RegisterBefore] error: ", err.Error())
		return err
	}


	if err := initializer.RegisterAfterAuthenticateCustom(core.AfterAuthenticateSteamWeb); err != nil {
		logger.Error("[RegisterAfter] error: ", err.Error())
		return err
	}

	return nil
}
