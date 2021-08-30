import { Page } from "../../../official-generic-layout/classes/PageController";

export module Configuration
{
    // This is a category page, we don't actually create a routing method through here.
    // But we diffently use this as data.
    export class SecurityCategory extends Page
    {
        constructor()
        {
            super("Security", 'security', 'security', true, false);
        }
    }
}

export const SecurityCategory = new Configuration.SecurityCategory();