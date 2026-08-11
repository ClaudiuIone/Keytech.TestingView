namespace Keytech.TestingView.Extension
{
    public static class Provider
    {
        /// <summary>
        /// This method only ensures the project is referenced and called so that the compiler copies the JS files to the output directory.
        /// </summary>
        public static bool EnsureExecution()
        {
            return true;
        }
    }
}
