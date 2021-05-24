import { Form } from "../../../API/FormFactory";
import { RouteManager } from "../../../API/internal/RouteManager";
import { Route, RouteType, ROUTE_FIRST } from "../../../API/Routing";
import { LoginForm } from "../forms/loginForm";

export class LoginRoute extends Route
{
    constructor()
    {
        super("/");

        this.CustomRoute(RouteType.GET | RouteType.POST, "login", (req, res, next) => 
        {
            const loginForm = Form.CreateForm(new LoginForm(this), res) as LoginForm;
            if (loginForm.Verify(req))
            {
                const user = loginForm.GetUser();
                if (user == undefined)
                {
                    return next();
                }
                res.cookie('session', user.GetId()); // Temporary thing; we just want to see, if we can pick it up later...
                return res.redirect(RouteManager.GetRouteLabel('index'));
            }

            return res.status(200).render('views/login.ejs', { login_form: loginForm.View() });
        }, 'login', ROUTE_FIRST);

        this.CustomRoute(RouteType.GET | RouteType.POST, "register", (req, res, next) => 
        {
            // const user = UserBaseManager.NewUser();
            // const registerForm = user.GenerateRegisterForm(this);
            return res.status(200);
        }, 'register');

        this.Get("logout", (req, res, next) => 
        {
            // Clean out all cookies...
            const cookie = req.cookies;
            for (var prop in cookie) 
            {
                if (!cookie.hasOwnProperty(prop)) 
                {
                    continue;
                }    
                res.clearCookie(prop);
            }

            // Redirect to home; which should take you back to login (if enabled)
            res.redirect(RouteManager.GetRouteLabel('index'));
        }, 'logout');
    }
}