import { Route, ROUTE_FIRST } from "../../../API/Routing";

export class OverrideIndexSecurityRoute extends Route
{
    constructor()
    {
        super("/");

        this.Get("", (req, res, next) => 
        {
            if (true)
            {
                res.redirect('login');
            }
        }, "home", ROUTE_FIRST);
    }
}