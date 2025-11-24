package main

import (
	"context"
	"database/sql"

	"github.com/heroiclabs/nakama-common/runtime"
	core "io.github.visualsource/dnd-workshop/module"
)

func InitModule(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, initializer runtime.Initializer) error {
	

	err := initializer.RegisterMatch("session-handler",core.NewMatch)

	if err != nil {
		logger.Error("[RegisterMatch] error: ",err.Error())
		return err 
	}

	return nil
}
