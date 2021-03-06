/*

     jsNGError - Object for throwing Norton Guide errors.
     Copyright (C) 2017 Dave Pearson

     This program is free software: you can redistribute it and/or modify it
     under the terms of the GNU General Public License as published by the
     Free Software Foundation, either version 3 of the License, or (at your
     option) any later version.

     This program is distributed in the hope that it will be useful, but
     WITHOUT ANY WARRANTY; without even the implied warranty of
     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
     General Public License for more details.

     You should have received a copy of the GNU General Public License along
     with this program. If not, see <http://www.gnu.org/licenses/>.

*/

// Custom error object for NG errors.
function NGError( message ) {
    "use strict";
    this.message = message;
    Error.captureStackTrace( this, NGError )
}

// Set NGError up to properly inherit from Error.
NGError.prototype             = Object.create( Error.prototype );
NGError.prototype.name        = "NGError";
NGError.prototype.constructor = NGError;

// Export it.
module.exports = NGError;

/* jsNGError.js ends here */
